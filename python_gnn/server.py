# python_gnn/server.py
import grpc
import time
from concurrent import futures

# Import the generated protobuf classes
import telemetry_pb2
import telemetry_pb2_grpc

# Import our AI and Spatial math
from model import CyberCrimeGNN, get_h3_index

class GnnInferenceServicer(telemetry_pb2_grpc.GnnInferenceServiceServicer):
    def __init__(self):
        self.model = CyberCrimeGNN()
        self.model.eval() # Set to evaluation mode

    def EvaluateRisk(self, request, context):
        print(f"[gRPC IN] Evaluating Tx: {request.transaction_id}")
        
        # 1. Run in-memory PyTorch graph evaluation
        risk_score = self.model(
            amount=request.amount,
            hop_count=request.hop_count,
            velocity=request.velocity_score
        )
        
        # 2. Compute Uber H3 Geolocation
        target_h3 = get_h3_index(request.latitude, request.longitude)
        
        # 3. Apply RBI Automated Hold Logic (SLA Fallback)
        # If score > 0.95, it mandates an immediate hardware halt at the ATM/AePS
        requires_hold = risk_score > 0.95
        
        # 4. Map Jurisdiction based on physical off-ramp
        jurisdiction = "KARNATAKA_CYBER_CELL" if request.latitude > 12.0 else "KERALA_CYBER_CELL"
        
        print(f"[gRPC OUT] Score: {risk_score:.3f} | H3: {target_h3} | Hold: {requires_hold}")
        
        return telemetry_pb2.RiskAssessment(
            transaction_id=request.transaction_id,
            risk_score=risk_score,
            h3_index=target_h3,
            requires_debit_hold=requires_hold,
            target_jurisdiction=jurisdiction
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    telemetry_pb2_grpc.add_GnnInferenceServiceServicer_to_server(
        GnnInferenceServicer(), server
    )
    # Bind to port 50051 (The exact port Rust is sending traffic to)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Python PyTorch GNN Engine running on port 50051...")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()