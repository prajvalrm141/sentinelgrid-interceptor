fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Forces Cargo to recompile if you modify the proto contract
    println!("cargo:rerun-if-changed=../proto/telemetry.proto");
    
    // Compiles the proto file into native Rust modules
    tonic_build::configure()
        .compile(&["../proto/telemetry.proto"], &["../proto"])?;
    
    Ok(())
}