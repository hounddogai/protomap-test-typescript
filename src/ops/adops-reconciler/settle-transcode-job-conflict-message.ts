import * as experimentsExposureApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_approval_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleTranscodeJobConflictMessage keeps of each ResolveTranscodeJobConflict response. */
interface SettleTranscodeJobConflictMessageRecord {
  message: string;
  correlationId: string;
  resultMessage: string;
}

/**
 * Reads acme.media.v1.TranscodeJobSyncService/ResolveTranscodeJobConflict, keeps its fields by name, and
 * passes some of them to acme.experiments.v1.ExposureApprovalService.
 */
export async function settleTranscodeJobConflictMessage(runtime: Runtime): Promise<void> {
  const source = new mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictRequest, mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictResponse>(
    (request, done) => source.resolveTranscodeJobConflict(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictRequest.fromPartial({ reason: "live-settle-transcode-job-conflict-message" }));
  const entry: SettleTranscodeJobConflictMessageRecord = {
    message: text.normalize(current.outcome?.message ?? ""),
    correlationId: text.normalize(current.result?.correlationId ?? ""),
    resultMessage: current.result?.message ?? "",
  };
  const carried = new URLSearchParams();
  carried.set("message", entry.message);
  carried.set("correlation-id", entry.correlationId);
  carried.set("result-message", entry.resultMessage);
  const target = new experimentsExposureApprovalServiceApi.ExposureApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<experimentsExposureApprovalServiceApi.SubmitExposureRequest, experimentsExposureApprovalServiceApi.SubmitExposureResponse>(
    (request, done) => target.submitExposure(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    experimentsExposureApprovalServiceApi.SubmitExposureRequest.fromPartial({ exposure: { source: carried.get("result-message") ?? "" } })));
}
