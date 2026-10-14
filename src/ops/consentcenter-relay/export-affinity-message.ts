import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as personalizationAffinityLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportAffinityMessage keeps of each TerminateAffinity response. */
interface ExportAffinityMessageRecord {
  message: string;
  resultMessage: string;
  kind: string;
  referenceId: string;
}

/**
 * Reads acme.personalization.v1.AffinityLifecycleService/TerminateAffinity, keeps its fields by name, and
 * passes some of them to acme.notifications.v1.DeliveryAttemptWorkflowService.
 */
export async function exportAffinityMessage(runtime: Runtime): Promise<void> {
  const source = new personalizationAffinityLifecycleServiceApi.AffinityLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<personalizationAffinityLifecycleServiceApi.TerminateAffinityRequest, personalizationAffinityLifecycleServiceApi.TerminateAffinityResponse>(
    (request, done) => source.terminateAffinity(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    personalizationAffinityLifecycleServiceApi.TerminateAffinityRequest.fromPartial({ reason: "nightly-export-affinity-message" }));
  const entry: ExportAffinityMessageRecord = {
    message: found.outcome?.message ?? "",
    resultMessage: found.result?.message ?? "",
    kind: found.affinity?.kind ?? "",
    referenceId: found.outcome?.referenceId ?? "",
  };
  const carried = new URLSearchParams();
  carried.set("message", entry.message);
  carried.set("result-message", entry.resultMessage);
  carried.set("kind", entry.kind);
  carried.set("reference-id", entry.referenceId);
  const writer = new notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  await call<notificationsDeliveryAttemptWorkflowServiceApi.InspectDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.InspectDeliveryAttemptWorkflowResponse>(
    (request, done) => writer.inspectDeliveryAttemptWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    notificationsDeliveryAttemptWorkflowServiceApi.InspectDeliveryAttemptWorkflowRequest.fromPartial({ deliveryAttemptId: carried.get("message") ?? "" }));
}
