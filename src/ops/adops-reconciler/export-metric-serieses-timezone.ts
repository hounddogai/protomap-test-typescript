import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import * as formsFormWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportMetricSeriesesTimezone keeps of each SummarizeMetricSerieses response. */
interface ExportMetricSeriesesTimezoneRecord {
  timezone: string;
  status: string;
  correlationId: string;
  message: string;
}

/** Where exportMetricSeriesesTimezone hands each record. */
interface ExportMetricSeriesesTimezoneTarget {
  forward(record: ExportMetricSeriesesTimezoneRecord): Promise<void>;
}

/** Passes records to acme.campaigns.v1.CampaignBudgetWorkflowService. */
class ExportMetricSeriesesTimezoneCampaignBudgetWorkflow implements ExportMetricSeriesesTimezoneTarget {
  private readonly client: campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ExportMetricSeriesesTimezoneRecord): Promise<void> {
    await retry(() => call<campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowResponse>(
      (request, done) => this.client.advanceCampaignBudgetWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowRequest.fromPartial({ campaignBudget: { campaignBudgetId: record.correlationId }, details: { initiatedBy: record.timezone } })));
  }
}

/** Writes records to acme.forms.v1.FormWorkflowService. */
class ExportMetricSeriesesTimezoneFormWorkflow implements ExportMetricSeriesesTimezoneTarget {
  private readonly client: formsFormWorkflowServiceApi.FormWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormWorkflowServiceApi.FormWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ExportMetricSeriesesTimezoneRecord): Promise<void> {
    await call<formsFormWorkflowServiceApi.CancelFormWorkflowRequest, formsFormWorkflowServiceApi.CancelFormWorkflowResponse>(
      (request, done) => this.client.cancelFormWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      formsFormWorkflowServiceApi.CancelFormWorkflowRequest.fromPartial({ formId: record.message, form: { number: record.timezone, notes: record.correlationId } }));
  }
}

/** Passes records to acme.media.v1.MediaAssetApprovalService. */
class ExportMetricSeriesesTimezoneMediaAssetApproval implements ExportMetricSeriesesTimezoneTarget {
  private readonly client: mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ExportMetricSeriesesTimezoneRecord): Promise<void> {
    await retry(() => call<mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalRequest, mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalResponse>(
      (request, done) => this.client.delegateMediaAssetApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaMediaAssetApprovalServiceApi.DelegateMediaAssetApprovalRequest.fromPartial({ details: { comment: record.timezone }, mediaAsset: { code: record.message } })));
  }
}

/** Runs the action registered for kind. */
async function actOnExportMetricSeriesesTimezone(kind: string, record: ExportMetricSeriesesTimezoneRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "campaign-budget-workflow": () => new ExportMetricSeriesesTimezoneCampaignBudgetWorkflow(runtime).forward(record),
    "form-workflow": () => new ExportMetricSeriesesTimezoneFormWorkflow(runtime).forward(record),
    "media-asset-approval": () => new ExportMetricSeriesesTimezoneMediaAssetApproval(runtime).forward(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.metrics.v1.MetricSeriesQueryService/SummarizeMetricSerieses and hands what it keeps to the sink
 * of its kind.
 */
export async function exportMetricSeriesesTimezone(runtime: Runtime): Promise<void> {
  const origin = new metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<metricsMetricSeriesQueryServiceApi.SummarizeMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SummarizeMetricSeriesesResponse>(
    (request, done) => origin.summarizeMetricSerieses(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    metricsMetricSeriesQueryServiceApi.SummarizeMetricSeriesesRequest.fromPartial({ metricSeriesId: "main-export-metric-serieses-timezone" })));
  const entry: ExportMetricSeriesesTimezoneRecord = {
    timezone: text.normalize(reply.period?.timezone ?? ""),
    status: text.normalize(reply.result?.status ?? ""),
    correlationId: reply.result?.correlationId ?? "",
    message: reply.result?.message ?? "",
  };
  await actOnExportMetricSeriesesTimezone("form-workflow", entry, runtime);
}
