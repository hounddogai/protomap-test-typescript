import { status } from "@grpc/grpc-js";
import { RpcError } from "./errors.js";

export interface Configuration {
  listen: string;
  mesh: string;
  databaseUrl: string;
  tenant: string;
  serviceToken: string;
}

/** Deployment configuration comes from the environment; credentials never live in source control. */
export function configuration(): Configuration {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new RpcError(status.FAILED_PRECONDITION, "DATABASE_URL is required");
  return {
    listen: process.env["GRPC_LISTEN"] ?? "127.0.0.1:8443",
    mesh: process.env["GRPC_MESH"] ?? "127.0.0.1:15001",
    databaseUrl, tenant: process.env["ACME_TENANT"] ?? "acme",
    serviceToken: process.env["ACME_SERVICE_TOKEN"] ?? "",
  };
}
