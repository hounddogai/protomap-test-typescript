import { promisify } from "node:util";
import { Metadata, status, type ClientUnaryCall, type ServiceError } from "@grpc/grpc-js";
import type { RequestContext } from "../../.cache/proto/acme/common/v1/context.js";
import { RpcError, requireReply } from "./errors.js";

export type Callback<T> = (error: ServiceError | null, response?: T) => void;
export type Unary<Req, Res> = (request: Req, callback: Callback<Res>) => ClientUnaryCall;

/** Tenant context follows the message; service-to-service credentials come from the deployment. */
export function metadataFor(context: RequestContext | undefined): Metadata {
  const metadata = new Metadata();
  metadata.set("authorization", `Bearer ${process.env["ACME_SERVICE_TOKEN"] ?? ""}`);
  metadata.set("x-tenant-id", context?.tenantId ?? process.env["ACME_TENANT"] ?? "acme");
  return metadata;
}

/** The narrow port keeps callback overloads outside domain workflows. */
export function call<Req, Res>(fn: Unary<Req, Res>, request: Req): Promise<Res> {
  return new Promise((resolve, reject) => {
    fn(request, (error, response) => {
      if (error) reject(error);
      else if (response === undefined) reject(new RpcError(status.INTERNAL, "Missing upstream response"));
      else resolve(response);
    });
  });
}

export function promised<Req, Res>(fn: Unary<Req, Res>): (request: Req) => Promise<Res> {
  const invoke = promisify(fn);
  return async (request) => requireReply(await invoke(request));
}

export interface RequestPort<Req, Res> { execute(request: Req): Promise<Res>; }

export class GrpcAdapter<Req, Res> implements RequestPort<Req, Res> {
  private readonly invoke: (request: Req) => Promise<Res>;
  constructor(fn: Unary<Req, Res>) { this.invoke = promised(fn); }
  execute(request: Req): Promise<Res> { return this.invoke(request); }
}

/** Bind forwarded methods to the real client: grpc-js stores its channel on the receiver. */
export function forwarding<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, property, receiver) {
      const member: unknown = Reflect.get(target, property, receiver);
      return typeof member === "function" ? member.bind(target) : member;
    },
  });
}

export function operation<Req, Res>(fn: Unary<Req, Res>): (request: Req) => () => Promise<Res> {
  return (request) => () => call(fn, request);
}

export async function retry<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); }
  catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== status.UNAVAILABLE) throw error;
    return work();
  }
}

/** Stages remain explicit because operations staff profile validation, quotas, and remote execution separately. */
export async function workflow<T>(name: string, work: () => Promise<T>): Promise<T> {
  if (!name) throw new RpcError(status.INVALID_ARGUMENT, "A workflow name is required");
  return auditStage(() => dispatchStage(work));
}
async function auditStage<T>(work: () => Promise<T>): Promise<T> { return work(); }
async function dispatchStage<T>(work: () => Promise<T>): Promise<T> { return work(); }
