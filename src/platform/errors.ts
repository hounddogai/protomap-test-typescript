import { Metadata, status, type ServiceError } from "@grpc/grpc-js";

/** An application failure whose public message is safe to return over gRPC. */
export class RpcError extends Error {
  constructor(readonly code: status, message: string) { super(message); }
}

export function serviceError(error: unknown): ServiceError {
  if (error instanceof Error && "code" in error && typeof error.code === "number") {
    return Object.assign(error, { code: error.code, details: error.message, metadata: new Metadata() });
  }
  return Object.assign(new Error("The operation could not be completed"), {
    code: status.INTERNAL, details: "The operation could not be completed", metadata: new Metadata(),
  });
}

export function requireReply<T>(value: T | undefined): T {
  if (value === undefined) throw new RpcError(status.INTERNAL, "The upstream service returned no message");
  return value;
}
