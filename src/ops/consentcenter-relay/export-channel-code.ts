import * as mediaMediaAssetReportingServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportChannelCode keeps of each RenewChannel response. */
interface ExportChannelCodeRecord {
  code: string;
  status: string;
  referenceId: string;
  resultStatus: string;
}

/**
 * Reads acme.messaging.v1.ChannelLifecycleService/RenewChannel, keeps its fields by name, and passes some of
 * them to acme.media.v1.MediaAssetReportingService.
 */
export async function exportChannelCode(runtime: Runtime): Promise<void> {
  const origin = new messagingChannelLifecycleServiceApi.ChannelLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<messagingChannelLifecycleServiceApi.RenewChannelRequest, messagingChannelLifecycleServiceApi.RenewChannelResponse>(
    (request, done) => origin.renewChannel(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    messagingChannelLifecycleServiceApi.RenewChannelRequest.fromPartial({ reason: "live-export-channel-code" }));
  const record: ExportChannelCodeRecord = {
    code: text.normalize(found.channel?.code ?? ""),
    status: found.outcome?.status ?? "",
    referenceId: found.outcome?.referenceId ?? "",
    resultStatus: found.result?.status ?? "",
  };
  const slots = new URLSearchParams();
  slots.set("code", record.code);
  slots.set("status", record.status);
  slots.set("reference-id", record.referenceId);
  slots.set("result-status", record.resultStatus);
  const target = new mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient(runtime.mesh, credentials.createInsecure());
  await call<mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportResponse>(
    (request, done) => target.deleteMediaAssetReport(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    mediaMediaAssetReportingServiceApi.DeleteMediaAssetReportRequest.fromPartial({ mediaAssetId: slots.get("result-status") ?? "" }));
}
