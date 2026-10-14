import * as contentContentBlockQueryServiceApi from "../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as fleetVehicleQueryServiceApi from "../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayDeliveryAttemptConflictsMessage keeps of each ListDeliveryAttemptConflicts response. */
interface RelayDeliveryAttemptConflictsMessageRecord {
  message: string;
  correlationId: string;
  status: string;
}

/** Where relayDeliveryAttemptConflictsMessage hands each record. */
interface RelayDeliveryAttemptConflictsMessageSink {
  push(record: RelayDeliveryAttemptConflictsMessageRecord): Promise<void>;
}

/** Writes records to acme.content.v1.ContentBlockQueryService. */
class RelayDeliveryAttemptConflictsMessageContentBlockQuery implements RelayDeliveryAttemptConflictsMessageSink {
  private readonly client: contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayDeliveryAttemptConflictsMessageRecord): Promise<void> {
    await call<contentContentBlockQueryServiceApi.PeekContentBlockRequest, contentContentBlockQueryServiceApi.PeekContentBlockResponse>(
      (request, done) => this.client.peekContentBlock(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentContentBlockQueryServiceApi.PeekContentBlockRequest.fromPartial({ contentBlockId: record.correlationId }));
  }
}

/** Passes records to acme.media.v1.TranscodeJobApprovalService. */
class RelayDeliveryAttemptConflictsMessageTranscodeJobApproval implements RelayDeliveryAttemptConflictsMessageSink {
  private readonly client: mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayDeliveryAttemptConflictsMessageRecord): Promise<void> {
    await retry(() => call<mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusRequest, mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusResponse>(
      (request, done) => this.client.getTranscodeJobApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaTranscodeJobApprovalServiceApi.GetTranscodeJobApprovalStatusRequest.fromPartial({ transcodeJobId: record.message })));
  }
}

/** Writes records to acme.fleet.v1.VehicleQueryService. */
class RelayDeliveryAttemptConflictsMessageVehicleQuery implements RelayDeliveryAttemptConflictsMessageSink {
  private readonly client: fleetVehicleQueryServiceApi.VehicleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fleetVehicleQueryServiceApi.VehicleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayDeliveryAttemptConflictsMessageRecord): Promise<void> {
    await call<fleetVehicleQueryServiceApi.FindVehiclesRequest, fleetVehicleQueryServiceApi.FindVehiclesResponse>(
      (request, done) => this.client.findVehicles(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      fleetVehicleQueryServiceApi.FindVehiclesRequest.fromPartial({ filter: { region: record.status, query: record.message }, page: { pageToken: record.correlationId } }));
  }
}

/**
 * Reads acme.notifications.v1.DeliveryAttemptSyncService/ListDeliveryAttemptConflicts and hands what it keeps
 * to the sink of its kind.
 */
export async function relayDeliveryAttemptConflictsMessage(runtime: Runtime): Promise<void> {
  const reader = new notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest, notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsResponse>(
    (request, done) => reader.listDeliveryAttemptConflicts(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    notificationsDeliveryAttemptSyncServiceApi.ListDeliveryAttemptConflictsRequest.fromPartial({ orderBy: "primary-relay-delivery-attempt-conflicts-message" }));
  const entry: RelayDeliveryAttemptConflictsMessageRecord = {
    message: current.result?.message ?? "",
    correlationId: text.normalize(current.result?.correlationId ?? ""),
    status: current.result?.status ?? "",
  };
  const sinks = new Map<string, RelayDeliveryAttemptConflictsMessageSink>([
    ["content-block-query", new RelayDeliveryAttemptConflictsMessageContentBlockQuery(runtime)],
    ["transcode-job-approval", new RelayDeliveryAttemptConflictsMessageTranscodeJobApproval(runtime)],
    ["vehicle-query", new RelayDeliveryAttemptConflictsMessageVehicleQuery(runtime)],
  ]);
  const sink = sinks.get(process.env["RELAY_DELIVERY_ATTEMPT_CONFLICTS_MESSAGE_TARGET"] ?? "");
  if (!sink) return;
  await sink.push(entry);
}
