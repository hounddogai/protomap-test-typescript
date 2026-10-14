import * as experimentsExposureSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as mediaMediaAssetServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleMediaAssetStatus keeps of each UpdateMediaAsset response. */
interface SettleMediaAssetStatusRecord {
  status: string;
  name: string;
  message: string;
  code: string;
}

/**
 * Reads acme.media.v1.MediaAssetService/UpdateMediaAsset, keeps its fields by name, and passes some of them
 * to acme.experiments.v1.ExposureSyncService.
 */
export async function settleMediaAssetStatus(runtime: Runtime): Promise<void> {
  const upstream = new mediaMediaAssetServiceApi.MediaAssetServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<mediaMediaAssetServiceApi.UpdateMediaAssetRequest, mediaMediaAssetServiceApi.UpdateMediaAssetResponse>(
    (request, done) => upstream.updateMediaAsset(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaMediaAssetServiceApi.UpdateMediaAssetRequest.fromPartial({}));
  const row: SettleMediaAssetStatusRecord = {
    status: text.normalize(current.result?.status ?? ""),
    name: current.mediaAsset?.name ?? "",
    message: current.result?.message ?? "",
    code: current.mediaAsset?.code ?? "",
  };
  const params = new Headers();
  params.set("x-status", row.status);
  params.set("x-name", row.name);
  params.set("x-message", row.message);
  params.set("x-code", row.code);
  const target = new experimentsExposureSyncServiceApi.ExposureSyncServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<experimentsExposureSyncServiceApi.PushExposureRequest, experimentsExposureSyncServiceApi.PushExposureResponse>(
    (request, done) => target.pushExposure(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    experimentsExposureSyncServiceApi.PushExposureRequest.fromPartial({ exposure: { correlationId: params.get("x-message") ?? "" }, details: { cursor: params.get("x-name") ?? "" } })));
}
