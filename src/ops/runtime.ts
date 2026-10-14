import { Metadata } from "@grpc/grpc-js";

/** What every job of the operations programs shares: where the mesh is, and the metadata each call carries. */
export interface Runtime {
  readonly mesh: string;
  readonly metadata: Metadata;
}

/** Reads the deployment's settings; the service token comes from the environment, never from source control. */
export function connect(): Runtime {
  const metadata = new Metadata();
  metadata.set("authorization", `Bearer ${process.env["ACME_SERVICE_TOKEN"] ?? ""}`);
  metadata.set("x-tenant-id", process.env["ACME_TENANT"] ?? "acme");
  return { mesh: process.env["GRPC_MESH"] ?? "127.0.0.1:15001", metadata };
}
