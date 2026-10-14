import * as complianceComplianceCaseCalculationServiceApi from "../../../.cache/proto/acme/compliance/v1/compliance_case_calculation_service.js";
import * as mediaRenditionQueryServiceApi from "../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleComplianceCaseCalculationId keeps of each ExplainComplianceCaseCalculation response. */
interface SettleComplianceCaseCalculationIdRecord {
  referenceId: string;
  status: string;
  message: string;
  complianceCaseId: string;
}

/** Where settleComplianceCaseCalculationId hands each record. */
interface SettleComplianceCaseCalculationIdWriter {
  send(record: SettleComplianceCaseCalculationIdRecord): Promise<void>;
}

/** Passes records to acme.webhooks.v1.WebhookDeliveryWorkflowService. */
class SettleComplianceCaseCalculationIdWebhookDeliveryWorkflow implements SettleComplianceCaseCalculationIdWriter {
  private readonly client: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleComplianceCaseCalculationIdRecord): Promise<void> {
    await call<webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowResponse>(
      (request, done) => this.client.retryWebhookDeliveryWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webhooksWebhookDeliveryWorkflowServiceApi.RetryWebhookDeliveryWorkflowRequest.fromPartial({ webhookDelivery: { source: record.status, correlationId: record.message }, webhookDeliveryId: record.referenceId }));
  }
}

/** Writes records to acme.media.v1.RenditionQueryService. */
class SettleComplianceCaseCalculationIdRenditionQuery implements SettleComplianceCaseCalculationIdWriter {
  private readonly client: mediaRenditionQueryServiceApi.RenditionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionQueryServiceApi.RenditionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleComplianceCaseCalculationIdRecord): Promise<void> {
    await call<mediaRenditionQueryServiceApi.BrowseRenditionsRequest, mediaRenditionQueryServiceApi.BrowseRenditionsResponse>(
      (request, done) => this.client.browseRenditions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaRenditionQueryServiceApi.BrowseRenditionsRequest.fromPartial({ filter: { query: record.referenceId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnSettleComplianceCaseCalculationId(kind: string, record: SettleComplianceCaseCalculationIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "webhook-delivery-workflow": () => new SettleComplianceCaseCalculationIdWebhookDeliveryWorkflow(runtime).send(record),
    "rendition-query": () => new SettleComplianceCaseCalculationIdRenditionQuery(runtime).send(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.compliance.v1.ComplianceCaseCalculationService/ExplainComplianceCaseCalculation and hands what
 * it keeps to the sink of its kind.
 */
export async function settleComplianceCaseCalculationId(runtime: Runtime): Promise<void> {
  const reader = new complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<complianceComplianceCaseCalculationServiceApi.ExplainComplianceCaseCalculationRequest, complianceComplianceCaseCalculationServiceApi.ExplainComplianceCaseCalculationResponse>(
    (request, done) => reader.explainComplianceCaseCalculation(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    complianceComplianceCaseCalculationServiceApi.ExplainComplianceCaseCalculationRequest.fromPartial({ reason: "nightly-settle-compliance-case-calculation-id" }));
  const entry: SettleComplianceCaseCalculationIdRecord = {
    referenceId: text.normalize(response.outcome?.referenceId ?? ""),
    status: response.outcome?.status ?? "",
    message: response.result?.message ?? "",
    complianceCaseId: text.normalize(response.complianceCase?.complianceCaseId ?? ""),
  };
  await actOnSettleComplianceCaseCalculationId("webhook-delivery-workflow", entry, runtime);
}
