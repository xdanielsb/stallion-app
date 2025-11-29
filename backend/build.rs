fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Use tonic_build to compile proto files
    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .out_dir("src/")  // Output directly to src/
        .compile_protos(
            &["proto/image_service.proto"],
            &["proto"],
        )?;
    
    println!("cargo:rerun-if-changed=proto/image_service.proto");
    Ok(())
}