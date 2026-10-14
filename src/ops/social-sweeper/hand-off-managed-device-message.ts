import * as audiencesAudienceSyncApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_approval_service.js";
import * as devicesManagedDeviceServiceApi from "../../../.cache/proto/acme/devices/v1/managed_device_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffManagedDeviceMessage keeps of each CreateManagedDevice response. */
interface HandOffManagedDeviceMessageRecord {
  message: string;
  status: string;
}

/** Where handOffManagedDeviceMessage hands each record. */
interface HandOffManagedDeviceMessageSink {
  apply(record: HandOffManagedDeviceMessageRecord): Promise<void>;
}

/** Passes records to acme.audiences.v1.AudienceSyncApprovalService. */
class HandOffManagedDeviceMessageAudienceSyncApproval implements HandOffManagedDeviceMessageSink {
  private readonly client: audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffManagedDeviceMessageRecord): Promise<void> {
    await call<audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncResponse>(
      (request, done) => this.client.rejectAudienceSync(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      audiencesAudienceSyncApprovalServiceApi.RejectAudienceSyncRequest.fromPartial({ details: { comment: record.message } }));
  }
}

/** Hands records to acme.media.v1.MediaAssetSyncService. */
class HandOffManagedDeviceMessageMediaAssetSync implements HandOffManagedDeviceMessageSink {
  private readonly client: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffManagedDeviceMessageRecord): Promise<void> {
    await retry(() => call<mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest, mediaMediaAssetSyncServiceApi.SyncMediaAssetsResponse>(
      (request, done) => this.client.syncMediaAssets(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetSyncServiceApi.SyncMediaAssetsRequest.fromPartial({ details: { resolution: record.message, checksum: record.status } })));
  }
}

/** Runs the action registered for kind. */
async function actOnHandOffManagedDeviceMessage(kind: string, record: HandOffManagedDeviceMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "audience-sync-approval": () => new HandOffManagedDeviceMessageAudienceSyncApproval(runtime).apply(record),
    "media-asset-sync": () => new HandOffManagedDeviceMessageMediaAssetSync(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.devices.v1.ManagedDeviceService/CreateManagedDevice and hands what it keeps to the sink of its
 * kind.
 */
export async function handOffManagedDeviceMessage(runtime: Runtime): Promise<void> {
  const upstream = new devicesManagedDeviceServiceApi.ManagedDeviceServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<devicesManagedDeviceServiceApi.CreateManagedDeviceRequest, devicesManagedDeviceServiceApi.CreateManagedDeviceResponse>(
    (request, done) => upstream.createManagedDevice(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    devicesManagedDeviceServiceApi.CreateManagedDeviceRequest.fromPartial({ requestId: "current-hand-off-managed-device-message" })));
  const kept: HandOffManagedDeviceMessageRecord = {
    message: found.result?.message ?? "",
    status: text.normalize(found.result?.status ?? ""),
  };
  await actOnHandOffManagedDeviceMessage("audience-sync-approval", kept, runtime);
}
