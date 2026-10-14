import * as mediaMediaAssetValidationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as messagingParticipantSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryMediaAssetEligibilityStatus keeps of each CheckMediaAssetEligibility response. */
interface CarryMediaAssetEligibilityStatusRecord {
  status: string;
  message: string;
}

/** Where carryMediaAssetEligibilityStatus hands each record. */
interface CarryMediaAssetEligibilityStatusWriter {
  deliver(record: CarryMediaAssetEligibilityStatusRecord): Promise<void>;
}

/** Hands records to acme.messaging.v1.ParticipantSyncService. */
class CarryMediaAssetEligibilityStatusParticipantSync implements CarryMediaAssetEligibilityStatusWriter {
  private readonly client: messagingParticipantSyncServiceApi.ParticipantSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingParticipantSyncServiceApi.ParticipantSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryMediaAssetEligibilityStatusRecord): Promise<void> {
    await call<messagingParticipantSyncServiceApi.ReconcileParticipantsRequest, messagingParticipantSyncServiceApi.ReconcileParticipantsResponse>(
      (request, done) => this.client.reconcileParticipants(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingParticipantSyncServiceApi.ReconcileParticipantsRequest.fromPartial({ details: { checksum: record.message } }));
  }
}

/** Hands records to acme.webhooks.v1.WebhookDeliveryWorkflowService. */
class CarryMediaAssetEligibilityStatusWebhookDeliveryWorkflow implements CarryMediaAssetEligibilityStatusWriter {
  private readonly client: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryMediaAssetEligibilityStatusRecord): Promise<void> {
    await retry(() => call<webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowResponse>(
      (request, done) => this.client.inspectWebhookDeliveryWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookDeliveryWorkflowServiceApi.InspectWebhookDeliveryWorkflowRequest.fromPartial({ webhookDeliveryId: record.status })));
  }
}

/**
 * Reads acme.media.v1.MediaAssetValidationService/CheckMediaAssetEligibility and hands what it keeps to the
 * sink of its kind.
 */
export async function carryMediaAssetEligibilityStatus(runtime: Runtime): Promise<void> {
  const upstream = new mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityRequest, mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityResponse>(
    (request, done) => upstream.checkMediaAssetEligibility(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    mediaMediaAssetValidationServiceApi.CheckMediaAssetEligibilityRequest.fromPartial({ reason: "live-carry-media-asset-eligibility-status" }));
  const record: CarryMediaAssetEligibilityStatusRecord = {
    status: text.normalize(response.outcome?.status ?? ""),
    message: response.result?.message ?? "",
  };
  const sinks: CarryMediaAssetEligibilityStatusWriter[] = [
    new CarryMediaAssetEligibilityStatusParticipantSync(runtime),
    new CarryMediaAssetEligibilityStatusWebhookDeliveryWorkflow(runtime),
  ];
  await sinks[1]!.deliver(record);
}
