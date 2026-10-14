import * as licensingSoftwareLicenseQueryServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_query_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeDeliveryAttemptVersionStatus keeps of each AnnotateDeliveryAttemptVersion response. */
interface RouteDeliveryAttemptVersionStatusRecord {
  status: string;
  referenceId: string;
  source: string;
}

/**
 * Reads acme.notifications.v1.DeliveryAttemptHistoryService/AnnotateDeliveryAttemptVersion, keeps its fields
 * by name, and passes some of them to acme.licensing.v1.SoftwareLicenseQueryService.
 */
export async function routeDeliveryAttemptVersionStatus(runtime: Runtime): Promise<void> {
  const origin = new notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionResponse>(
    (request, done) => origin.annotateDeliveryAttemptVersion(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    notificationsDeliveryAttemptHistoryServiceApi.AnnotateDeliveryAttemptVersionRequest.fromPartial({ reason: "main-route-delivery-attempt-version-status" })));
  const record: RouteDeliveryAttemptVersionStatusRecord = {
    status: response.outcome?.status ?? "",
    referenceId: response.outcome?.referenceId ?? "",
    source: response.deliveryAttempt?.source ?? "",
  };
  const fields = new Headers();
  fields.set("x-status", record.status);
  fields.set("x-reference-id", record.referenceId);
  fields.set("x-source", record.source);
  const writer = new licensingSoftwareLicenseQueryServiceApi.SoftwareLicenseQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await call<licensingSoftwareLicenseQueryServiceApi.CountSoftwareLicensesRequest, licensingSoftwareLicenseQueryServiceApi.CountSoftwareLicensesResponse>(
    (request, done) => writer.countSoftwareLicenses(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    licensingSoftwareLicenseQueryServiceApi.CountSoftwareLicensesRequest.fromPartial({ filter: { region: fields.get("x-status") ?? "" }, page: { pageToken: fields.get("x-reference-id") ?? "" } }));
}
