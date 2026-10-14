import * as messagingConversationReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as recruitingJobOpeningCalculationServiceApi from "../../../.cache/proto/acme/recruiting/v1/job_opening_calculation_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import * as yardsYardCalculationServiceApi from "../../../.cache/proto/acme/yards/v1/yard_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportJobOpeningRatesMessage keeps of each GetJobOpeningRates response. */
interface ExportJobOpeningRatesMessageRecord {
  message: string;
  status: string;
  jobOpeningId: string;
}

/** Where exportJobOpeningRatesMessage hands each record. */
interface ExportJobOpeningRatesMessageDestination {
  deliver(record: ExportJobOpeningRatesMessageRecord): Promise<void>;
}

/** Hands records to acme.messaging.v1.ConversationReportingService. */
class ExportJobOpeningRatesMessageConversationReporting implements ExportJobOpeningRatesMessageDestination {
  private readonly client: messagingConversationReportingServiceApi.ConversationReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationReportingServiceApi.ConversationReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportJobOpeningRatesMessageRecord): Promise<void> {
    await retry(() => call<messagingConversationReportingServiceApi.DeleteConversationReportRequest, messagingConversationReportingServiceApi.DeleteConversationReportResponse>(
      (request, done) => this.client.deleteConversationReport(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingConversationReportingServiceApi.DeleteConversationReportRequest.fromPartial({ etag: record.jobOpeningId })));
  }
}

/** Writes records to acme.yards.v1.YardCalculationService. */
class ExportJobOpeningRatesMessageYardCalculation implements ExportJobOpeningRatesMessageDestination {
  private readonly client: yardsYardCalculationServiceApi.YardCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new yardsYardCalculationServiceApi.YardCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportJobOpeningRatesMessageRecord): Promise<void> {
    await call<yardsYardCalculationServiceApi.EstimateYardRequest, yardsYardCalculationServiceApi.EstimateYardResponse>(
      (request, done) => this.client.estimateYard(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      yardsYardCalculationServiceApi.EstimateYardRequest.fromPartial({ reason: record.message, details: { currencyCode: record.jobOpeningId }, yard: { name: record.status } }));
  }
}

/** Writes records to acme.webhooks.v1.WebhookEndpointWorkflowService. */
class ExportJobOpeningRatesMessageWebhookEndpointWorkflow implements ExportJobOpeningRatesMessageDestination {
  private readonly client: webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ExportJobOpeningRatesMessageRecord): Promise<void> {
    await retry(() => call<webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse>(
      (request, done) => this.client.resumeWebhookEndpointWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest.fromPartial({ reason: record.status })));
  }
}

/**
 * Reads acme.recruiting.v1.JobOpeningCalculationService/GetJobOpeningRates and hands what it keeps to the
 * sink of its kind.
 */
export async function exportJobOpeningRatesMessage(runtime: Runtime): Promise<void> {
  const origin = new recruitingJobOpeningCalculationServiceApi.JobOpeningCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<recruitingJobOpeningCalculationServiceApi.GetJobOpeningRatesRequest, recruitingJobOpeningCalculationServiceApi.GetJobOpeningRatesResponse>(
    (request, done) => origin.getJobOpeningRates(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    recruitingJobOpeningCalculationServiceApi.GetJobOpeningRatesRequest.fromPartial({ jobOpeningId: "main-export-job-opening-rates-message" }));
  const record: ExportJobOpeningRatesMessageRecord = {
    message: found.result?.message ?? "",
    status: found.result?.status ?? "",
    jobOpeningId: text.normalize(found.jobOpening?.jobOpeningId ?? ""),
  };
  const registry: Record<string, ExportJobOpeningRatesMessageDestination> = {};
  for (const entry of [
    { kind: "conversation-reporting", sink: new ExportJobOpeningRatesMessageConversationReporting(runtime) },
    { kind: "yard-calculation", sink: new ExportJobOpeningRatesMessageYardCalculation(runtime) },
    { kind: "webhook-endpoint-workflow", sink: new ExportJobOpeningRatesMessageWebhookEndpointWorkflow(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["webhook-endpoint-workflow"]!.deliver(record);
}
