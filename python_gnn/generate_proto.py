# python_gnn/generate_proto.py
import os
import subprocess

def compile_proto():
    proto_dir = "../proto"
    proto_file = "telemetry.proto"
    
    command = [
        "python", "-m", "grpc_tools.protoc",
        f"-I{proto_dir}",
        f"--python_out=.",
        f"--grpc_python_out=.",
        f"{proto_dir}/{proto_file}"
    ]
    
    print("Compiling Protobuf for Python...")
    subprocess.run(command, check=True)
    print("Generated telemetry_pb2.py and telemetry_pb2_grpc.py successfully.")

if __name__ == "__main__":
    compile_proto()