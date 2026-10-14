import * as experimentsVariantLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import * as identityUserServiceApi from "../../../.cache/proto/acme/identity/v1/user_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryUserMessage keeps of each GetUser response. */
interface CarryUserMessageRecord {
  message: string;
  userId: string;
  status: string;
  correlationId: string;
}

/** Where carryUserMessage hands each record. */
interface CarryUserMessageDestination {
  push(record: CarryUserMessageRecord): Promise<void>;
}

/** Writes records to acme.experiments.v1.VariantLifecycleService. */
class CarryUserMessageVariantLifecycle implements CarryUserMessageDestination {
  private readonly client: experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryUserMessageRecord): Promise<void> {
    await call<experimentsVariantLifecycleServiceApi.RenewVariantRequest, experimentsVariantLifecycleServiceApi.RenewVariantResponse>(
      (request, done) => this.client.renewVariant(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsVariantLifecycleServiceApi.RenewVariantRequest.fromPartial({ reason: record.correlationId, variantId: record.message, details: { reasonCode: record.userId } }));
  }
}

/**
 * Reads acme.identity.v1.UserService/GetUser and hands what it keeps to
 * acme.experiments.v1.VariantLifecycleService.
 */
export async function carryUserMessage(runtime: Runtime): Promise<void> {
  const source = new identityUserServiceApi.UserServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<identityUserServiceApi.GetUserRequest, identityUserServiceApi.GetUserResponse>(
    (request, done) => source.getUser(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    identityUserServiceApi.GetUserRequest.fromPartial({ userId: "primary-carry-user-message" }));
  const row: CarryUserMessageRecord = {
    message: current.result?.message ?? "",
    userId: text.normalize(current.user?.userId ?? ""),
    status: current.result?.status ?? "",
    correlationId: current.result?.correlationId ?? "",
  };
  await new CarryUserMessageVariantLifecycle(runtime).push(row);
}
