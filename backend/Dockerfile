# Multi-stage build for Rust gRPC application
FROM rust:1.85-slim AS builder

# Install tools needed for gRPC / protobuf codegen
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    protobuf-compiler \
    libprotobuf-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests first (better caching)
COPY Cargo.toml Cargo.lock ./

# Copy proto and source files
COPY proto ./proto
COPY src ./src

# Build application (generates gRPC code from .proto)
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 rustuser

WORKDIR /app

# Copy compiled binary from builder stage
COPY --from=builder /app/target/release/image-inference-server .

RUN chown rustuser:rustuser /app/image-inference-server

USER rustuser
EXPOSE 50051

CMD ["./image-inference-server"]