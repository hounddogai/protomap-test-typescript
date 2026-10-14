import * as broadcastsBroadcastQueryServiceApi from "../../../.cache/proto/acme/broadcasts/v1/broadcast_query_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaTranscodeJobLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_lifecycle_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncTranscodeJobId keeps of each SuspendTranscodeJob response. */
interface SyncTranscodeJobIdRecord {
  transcodeJobId: string;
  status: string;
  subject: string;
  resultStatus: string;
}

/** Where syncTranscodeJobId hands each record. */
interface SyncTranscodeJobIdSink {
  deliver(record: SyncTranscodeJobIdRecord): Promise<void>;
}

/** Passes records to acme.broadcasts.v1.BroadcastQueryService. */
class SyncTranscodeJobIdBroadcastQuery implements SyncTranscodeJobIdSink {
  private readonly client: broadcastsBroadcastQueryServiceApi.BroadcastQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new broadcastsBroadcastQueryServiceApi.BroadcastQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncTranscodeJobIdRecord): Promise<void> {
    await call<broadcastsBroadcastQueryServiceApi.PeekBroadcastRequest, broadcastsBroadcastQueryServiceApi.PeekBroadcastResponse>(
      (request, done) => this.client.peekBroadcast(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      broadcastsBroadcastQueryServiceApi.PeekBroadcastRequest.fromPartial({ broadcastId: record.transcodeJobId }));
  }
}

/** Sends records to acme.webbff.v1.PageCompositionNotificationService. */
class SyncTranscodeJobIdPageCompositionNotification implements SyncTranscodeJobIdSink {
  private readonly client: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncTranscodeJobIdRecord): Promise<void> {
    await call<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse>(
      (request, done) => this.client.unsubscribePageCompositionUpdates(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest.fromPartial({ details: { channel: record.subject, templateId: record.status } }));
  }
}

/** Writes records to acme.media.v1.MediaAssetCalculationService. */
class SyncTranscodeJobIdMediaAssetCalculation implements SyncTranscodeJobIdSink {
  private readonly client: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncTranscodeJobIdRecord): Promise<void> {
    await call<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse>(
      (request, done) => this.client.recalculateMediaAssets(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest.fromPartial({ reason: record.transcodeJobId }));
  }
}

/**
 * Reads acme.media.v1.TranscodeJobLifecycleService/SuspendTranscodeJob and hands what it keeps to the sink of
 * its kind.
 */
export async function syncTranscodeJobId(runtime: Runtime): Promise<void> {
  const upstream = new mediaTranscodeJobLifecycleServiceApi.TranscodeJobLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobResponse>(
    (request, done) => upstream.suspendTranscodeJob(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobRequest.fromPartial({ transcodeJobId: "default-sync-transcode-job-id" }));
  const record: SyncTranscodeJobIdRecord = {
    transcodeJobId: found.transcodeJob?.transcodeJobId ?? "",
    status: text.normalize(found.outcome?.status ?? ""),
    subject: text.normalize(found.transcodeJob?.subject ?? ""),
    resultStatus: found.result?.status ?? "",
  };
  const sinks: SyncTranscodeJobIdSink[] = [
    new SyncTranscodeJobIdBroadcastQuery(runtime),
    new SyncTranscodeJobIdPageCompositionNotification(runtime),
    new SyncTranscodeJobIdMediaAssetCalculation(runtime),
  ];
  await sinks[1]!.deliver(record);
}
