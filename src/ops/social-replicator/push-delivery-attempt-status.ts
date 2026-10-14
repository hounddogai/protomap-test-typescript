import * as audiencesAudienceMemberWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushDeliveryAttemptStatus keeps of each RevertDeliveryAttempt response. */
interface PushDeliveryAttemptStatusRecord {
  status: string;
  source: string;
  deliveryAttemptId: string;
}

/** Where pushDeliveryAttemptStatus hands each record. */
interface PushDeliveryAttemptStatusWriter {
  apply(record: PushDeliveryAttemptStatusRecord): Promise<void>;
}

/** Writes records to acme.experiments.v1.VariantCalculationService. */
class PushDeliveryAttemptStatusVariantCalculation implements PushDeliveryAttemptStatusWriter {
  private readonly client: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantCalculationServiceApi.VariantCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushDeliveryAttemptStatusRecord): Promise<void> {
    await call<experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest, experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse>(
      (request, done) => this.client.compareVariantOptions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest.fromPartial({ details: { currencyCode: record.status }, reason: record.source, variant: { name: record.deliveryAttemptId } }));
  }
}

/** Passes records to acme.audiences.v1.AudienceMemberWorkflowService. */
class PushDeliveryAttemptStatusAudienceMemberWorkflow implements PushDeliveryAttemptStatusWriter {
  private readonly client: audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushDeliveryAttemptStatusRecord): Promise<void> {
    await call<audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowResponse>(
      (request, done) => this.client.startAudienceMemberWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceMemberWorkflowServiceApi.StartAudienceMemberWorkflowRequest.fromPartial({ details: { initiatedBy: record.source }, audienceMemberId: record.deliveryAttemptId }));
  }
}

/**
 * Reads acme.notifications.v1.DeliveryAttemptHistoryService/RevertDeliveryAttempt and hands what it keeps to
 * the sink of its kind.
 */
export async function pushDeliveryAttemptStatus(runtime: Runtime): Promise<void> {
  const upstream = new notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse>(
    (request, done) => upstream.revertDeliveryAttempt(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest.fromPartial({ deliveryAttemptId: "current-push-delivery-attempt-status" }));
  const entry: PushDeliveryAttemptStatusRecord = {
    status: text.normalize(current.outcome?.status ?? ""),
    source: text.normalize(current.deliveryAttempt?.source ?? ""),
    deliveryAttemptId: current.deliveryAttempt?.deliveryAttemptId ?? "",
  };
  const entries: Array<{ kind: string; sink: PushDeliveryAttemptStatusWriter }> = [
    { kind: "variant-calculation", sink: new PushDeliveryAttemptStatusVariantCalculation(runtime) },
    { kind: "audience-member-workflow", sink: new PushDeliveryAttemptStatusAudienceMemberWorkflow(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "variant-calculation") continue;
    await entry.sink.apply(entry);
  }
}
