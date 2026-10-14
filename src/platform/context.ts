import { AsyncLocalStorage } from "node:async_hooks";
import { status } from "@grpc/grpc-js";
import type { RequestContext } from "../../.cache/proto/acme/common/v1/context.js";
import { RpcError } from "./errors.js";

export const requestScope = new AsyncLocalStorage<RequestContext>();

export function validateContext(context: RequestContext | undefined): asserts context is RequestContext {
  if (!context?.tenantId.trim()) throw new RpcError(status.INVALID_ARGUMENT, "context.tenant_id is required");
  if (context.tenantId.length > 128) throw new RpcError(status.INVALID_ARGUMENT, "tenant_id is too long");
}

/** Keep the trace context available to adapters without making it global mutable state. */
export function inRequest<T>(context: RequestContext, work: () => Promise<T>): Promise<T> {
  return requestScope.run(context, work);
}
