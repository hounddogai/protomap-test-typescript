import * as careplansCarePlanQueryServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_query_service.js";
import * as chatHandoffLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_lifecycle_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as mediaRenditionSyncServiceApi from "../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as webhooksWebhookSecretWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayTranslationJobReportStatus keeps of each ScheduleTranslationJobReport response. */
interface RelayTranslationJobReportStatusRecord {
  status: string;
  message: string;
  downloadUri: string;
}

/** Where relayTranslationJobReportStatus hands each record. */
interface RelayTranslationJobReportStatusWriter {
  apply(record: RelayTranslationJobReportStatusRecord): Promise<void>;
}

/** Hands records to acme.chat.v1.HandoffLifecycleService. */
class RelayTranslationJobReportStatusHandoffLifecycle implements RelayTranslationJobReportStatusWriter {
  private readonly client: chatHandoffLifecycleServiceApi.HandoffLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffLifecycleServiceApi.HandoffLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayTranslationJobReportStatusRecord): Promise<void> {
    await retry(() => call<chatHandoffLifecycleServiceApi.ActivateHandoffRequest, chatHandoffLifecycleServiceApi.ActivateHandoffResponse>(
      (request, done) => this.client.activateHandoff(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatHandoffLifecycleServiceApi.ActivateHandoffRequest.fromPartial({ details: { reasonCode: record.downloadUri }, handoffId: record.status, reason: record.message })));
  }
}

/** Passes records to acme.careplans.v1.CarePlanQueryService. */
class RelayTranslationJobReportStatusCarePlanQuery implements RelayTranslationJobReportStatusWriter {
  private readonly client: careplansCarePlanQueryServiceApi.CarePlanQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new careplansCarePlanQueryServiceApi.CarePlanQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayTranslationJobReportStatusRecord): Promise<void> {
    await call<careplansCarePlanQueryServiceApi.CountCarePlansRequest, careplansCarePlanQueryServiceApi.CountCarePlansResponse>(
      (request, done) => this.client.countCarePlans(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      careplansCarePlanQueryServiceApi.CountCarePlansRequest.fromPartial({ orderBy: record.downloadUri, filter: { ownerId: record.status } }));
  }
}

/** Writes records to acme.media.v1.RenditionSyncService. */
class RelayTranslationJobReportStatusRenditionSync implements RelayTranslationJobReportStatusWriter {
  private readonly client: mediaRenditionSyncServiceApi.RenditionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionSyncServiceApi.RenditionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayTranslationJobReportStatusRecord): Promise<void> {
    await retry(() => call<mediaRenditionSyncServiceApi.ListRenditionConflictsRequest, mediaRenditionSyncServiceApi.ListRenditionConflictsResponse>(
      (request, done) => this.client.listRenditionConflicts(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaRenditionSyncServiceApi.ListRenditionConflictsRequest.fromPartial({ filter: { query: record.downloadUri } })));
  }
}

/** Writes records to acme.webhooks.v1.WebhookSecretWorkflowService. */
class RelayTranslationJobReportStatusWebhookSecretWorkflow implements RelayTranslationJobReportStatusWriter {
  private readonly client: webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayTranslationJobReportStatusRecord): Promise<void> {
    await retry(() => call<webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowResponse>(
      (request, done) => this.client.resumeWebhookSecretWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookSecretWorkflowServiceApi.ResumeWebhookSecretWorkflowRequest.fromPartial({ webhookSecret: { currencyCode: record.status }, webhookSecretId: record.downloadUri, details: { initiatedBy: record.message } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayTranslationJobReportStatusLogOnly implements RelayTranslationJobReportStatusWriter {
  async apply(record: RelayTranslationJobReportStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchRelayTranslationJobReportStatus(kind: string, record: RelayTranslationJobReportStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: RelayTranslationJobReportStatusRecord): Promise<void> => new RelayTranslationJobReportStatusLogOnly().apply(item);
  switch (kind) {
    case "handoff-lifecycle":
      write = (item) => new RelayTranslationJobReportStatusHandoffLifecycle(runtime).apply(item);
      break;
    case "care-plan-query":
      write = (item) => new RelayTranslationJobReportStatusCarePlanQuery(runtime).apply(item);
      break;
    case "rendition-sync":
      write = (item) => new RelayTranslationJobReportStatusRenditionSync(runtime).apply(item);
      break;
    case "webhook-secret-workflow":
      write = (item) => new RelayTranslationJobReportStatusWebhookSecretWorkflow(runtime).apply(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.localization.v1.TranslationJobReportingService/ScheduleTranslationJobReport and hands what it
 * keeps to the sink of its kind.
 */
export async function relayTranslationJobReportStatus(runtime: Runtime): Promise<void> {
  const reader = new localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest, localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportResponse>(
    (request, done) => reader.scheduleTranslationJobReport(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    localizationTranslationJobReportingServiceApi.ScheduleTranslationJobReportRequest.fromPartial({ reason: "current-relay-translation-job-report-status" })));
  const entry: RelayTranslationJobReportStatusRecord = {
    status: current.result?.status ?? "",
    message: text.normalize(current.result?.message ?? ""),
    downloadUri: current.downloadUri,
  };
  await dispatchRelayTranslationJobReportStatus("rendition-sync", entry, runtime);
}
