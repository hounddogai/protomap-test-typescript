import * as messagingParticipantSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushParticipantConflictStatus keeps of each ResolveParticipantConflict response. */
interface PushParticipantConflictStatusRecord {
  status: string;
  message: string;
}

/** Where pushParticipantConflictStatus hands each record. */
interface PushParticipantConflictStatusSink {
  push(record: PushParticipantConflictStatusRecord): Promise<void>;
}

/** Hands records to acme.metrics.v1.MetricSeriesValidationService. */
class PushParticipantConflictStatusMetricSeriesValidation implements PushParticipantConflictStatusSink {
  private readonly client: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushParticipantConflictStatusRecord): Promise<void> {
    await retry(() => call<metricsMetricSeriesValidationServiceApi.PreviewMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.PreviewMetricSeriesResponse>(
      (request, done) => this.client.previewMetricSeries(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      metricsMetricSeriesValidationServiceApi.PreviewMetricSeriesRequest.fromPartial({ metricSeries: { code: record.message, metricSeriesId: record.status } })));
  }
}

/** Writes records to acme.personalization.v1.ProfileWorkflowService. */
class PushParticipantConflictStatusProfileWorkflow implements PushParticipantConflictStatusSink {
  private readonly client: personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PushParticipantConflictStatusRecord): Promise<void> {
    await call<personalizationProfileWorkflowServiceApi.StartProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse>(
      (request, done) => this.client.startProfileWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationProfileWorkflowServiceApi.StartProfileWorkflowRequest.fromPartial({ details: { initiatedBy: record.status }, profileId: record.message }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PushParticipantConflictStatusLogOnly implements PushParticipantConflictStatusSink {
  async push(record: PushParticipantConflictStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPushParticipantConflictStatus(kind: string, record: PushParticipantConflictStatusRecord, runtime: Runtime): Promise<void> {
  let sink: PushParticipantConflictStatusSink = new PushParticipantConflictStatusLogOnly();
  switch (kind) {
    case "metric-series-validation":
      sink = new PushParticipantConflictStatusMetricSeriesValidation(runtime);
      break;
    case "profile-workflow":
      sink = new PushParticipantConflictStatusProfileWorkflow(runtime);
      break;
  }
  await sink.push(record);
}

/**
 * Reads acme.messaging.v1.ParticipantSyncService/ResolveParticipantConflict and hands what it keeps to the
 * sink of its kind.
 */
export async function pushParticipantConflictStatus(runtime: Runtime): Promise<void> {
  const upstream = new messagingParticipantSyncServiceApi.ParticipantSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<messagingParticipantSyncServiceApi.ResolveParticipantConflictRequest, messagingParticipantSyncServiceApi.ResolveParticipantConflictResponse>(
    (request, done) => upstream.resolveParticipantConflict(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingParticipantSyncServiceApi.ResolveParticipantConflictRequest.fromPartial({ participantId: "default-push-participant-conflict-status" })));
  const entry: PushParticipantConflictStatusRecord = {
    status: found.result?.status ?? "",
    message: found.result?.message ?? "",
  };
  await deliverPushParticipantConflictStatus("metric-series-validation", entry, runtime);
}
