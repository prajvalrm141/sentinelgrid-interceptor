use axum::{routing::post, Json, Router};
use tower_http::cors::{Any, CorsLayer};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tonic::Request;
use tracing::info;

mod crypto;

pub mod telemetry {
    tonic::include_proto!("telemetry");
}

use telemetry::gnn_inference_service_client::GnnInferenceServiceClient;
use telemetry::TransactionPayload;

#[derive(Deserialize)]
pub struct RawTransactionRequest {
    pub transaction_id: String,
    pub source_account: String,
    pub target_account: String,
    pub amount: f64,
    pub timestamp: i64,
    pub latitude: f64,
    pub longitude: f64,
    pub off_ramp_type: String,
    pub hop_count: i32,
    pub velocity_score: f64,
}

#[derive(Serialize)]
pub struct IngestionResponse {
    pub status: String,
    pub transaction_id: String,
    pub risk_score: f32,
    pub h3_index: String,
    pub automated_hold_applied: bool,
    pub target_jurisdiction: String,
}

#[derive(Serialize)]
struct GoDispatchPayload {
    transaction_id: String,
    risk_score: f32,
    h3_index: String,
    target_jurisdiction: String,
    automated_hold: bool,
}

async fn ingest_transaction(
    Json(payload): Json<RawTransactionRequest>,
) -> Json<IngestionResponse> {
    let anonymized_payload = TransactionPayload {
        transaction_id: payload.transaction_id.clone(),
        hashed_source_account: crypto::hash_pii(&payload.source_account),
        hashed_target_account: crypto::hash_pii(&payload.target_account),
        amount: payload.amount,
        timestamp: payload.timestamp,
        latitude: payload.latitude,
        longitude: payload.longitude,
        off_ramp_type: payload.off_ramp_type,
        hop_count: payload.hop_count,
        velocity_score: payload.velocity_score,
    };

    let grpc_url = std::env::var("PYTHON_GRPC_URL")
        .unwrap_or_else(|_| "http://127.0.0.1:50051".into());

    match GnnInferenceServiceClient::connect(grpc_url).await {
        Ok(mut client) => {
            let request = Request::new(anonymized_payload);
            match client.evaluate_risk(request).await {
                Ok(response) => {
                    let res = response.into_inner();
                    
                    let dispatch_data = GoDispatchPayload {
                        transaction_id: res.transaction_id.clone(),
                        risk_score: res.risk_score,
                        h3_index: res.h3_index.clone(),
                        target_jurisdiction: res.target_jurisdiction.clone(),
                        automated_hold: res.requires_debit_hold,
                    };

                    tokio::spawn(async move {
                        let client = reqwest::Client::new();
                        let _ = client.post("http://127.0.0.1:8080/api/v1/dispatch")
                            .json(&dispatch_data)
                            .send()
                            .await;
                    });

                    Json(IngestionResponse {
                        status: "PROCESSED".into(),
                        transaction_id: res.transaction_id,
                        risk_score: res.risk_score,
                        h3_index: res.h3_index,
                        automated_hold_applied: res.requires_debit_hold,
                        target_jurisdiction: res.target_jurisdiction,
                    })
                }
                Err(e) => {
                    info!("gRPC evaluation error: {:?}", e);
                    Json(IngestionResponse {
                        status: "FALLBACK_HEURISTIC".into(),
                        transaction_id: payload.transaction_id,
                        risk_score: 0.50,
                        h3_index: "UNKNOWN".into(),
                        automated_hold_applied: false,
                        target_jurisdiction: "UNASSIGNED".into(),
                    })
                }
            }
        }
        Err(e) => {
            info!("gRPC connection error: {:?}", e);
            Json(IngestionResponse {
                status: "SERVICE_UNAVAILABLE".into(),
                transaction_id: payload.transaction_id,
                risk_score: 0.0,
                h3_index: "N/A".into(),
                automated_hold_applied: false,
                target_jurisdiction: "N/A".into(),
            })
        }
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // Permissive CORS layer to allow local web apps to connect
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/v1/ingest", post(ingest_transaction))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));

    info!("Rust Ingress Gateway online at http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}