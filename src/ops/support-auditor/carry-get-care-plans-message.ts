import * as careplansCarePlanServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_service.js";
import * as notificationsSubscriptionAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_admin_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryGetCarePlansMessage keeps of each BatchGetCarePlans response. */
interface CarryGetCarePlansMessageRecord {
  message: string;
  status: string;
}

/** Where carryGetCarePlansMessage hands each record. */
interface CarryGetCarePlansMessageDestination {
  write(record: CarryGetCarePlansMessageRecord): Promise<void>;
}

/** Hands records to acme.notifications.v1.SubscriptionAdminService. */
class CarryGetCarePlansMessageSubscriptionAdmin implements CarryGetCarePlansMessageDestination {
  private readonly client: notificationsSubscriptionAdminServiceApi.SubscriptionAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionAdminServiceApi.SubscriptionAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryGetCarePlansMessageRecord): Promise<void> {
    await call<notificationsSubscriptionAdminServiceApi.RestoreSubscriptionRequest, notificationsSubscriptionAdminServiceApi.RestoreSubscriptionResponse>(
      (request, done) => this.client.restoreSubscription(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsSubscriptionAdminServiceApi.RestoreSubscriptionRequest.fromPartial({ details: { reasonCode: record.message }, reason: record.status }));
  }
}

/**
 * Reads acme.careplans.v1.CarePlanService/BatchGetCarePlans and hands what it keeps to
 * acme.notifications.v1.SubscriptionAdminService.
 */
export async function carryGetCarePlansMessage(runtime: Runtime): Promise<void> {
  const reader = new careplansCarePlanServiceApi.CarePlanServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<careplansCarePlanServiceApi.BatchGetCarePlansRequest, careplansCarePlanServiceApi.BatchGetCarePlansResponse>(
    (request, done) => reader.batchGetCarePlans(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    careplansCarePlanServiceApi.BatchGetCarePlansRequest.fromPartial({}));
  const kept: CarryGetCarePlansMessageRecord = {
    message: response.result?.message ?? "",
    status: response.result?.status ?? "",
  };
  await new CarryGetCarePlansMessageSubscriptionAdmin(runtime).write(kept);
}
