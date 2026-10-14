import * as mediaMediaAssetWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_workflow_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardMediaAssetWorkflowName keeps of each ResumeMediaAssetWorkflow response. */
interface ForwardMediaAssetWorkflowNameRecord {
  name: string;
  correlationId: string;
  message: string;
  code: string;
}

/**
 * Reads acme.media.v1.MediaAssetWorkflowService/ResumeMediaAssetWorkflow, keeps its fields by name, and
 * passes some of them to acme.media.v1.TranscodeJobReportingService.
 */
export async function forwardMediaAssetWorkflowName(runtime: Runtime): Promise<void> {
  const upstream = new mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowRequest, mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowResponse>(
    (request, done) => upstream.resumeMediaAssetWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaMediaAssetWorkflowServiceApi.ResumeMediaAssetWorkflowRequest.fromPartial({ mediaAssetId: "main-forward-media-asset-workflow-name" }));
  const record: ForwardMediaAssetWorkflowNameRecord = {
    name: text.normalize(response.mediaAsset?.name ?? ""),
    correlationId: response.result?.correlationId ?? "",
    message: response.result?.message ?? "",
    code: response.mediaAsset?.code ?? "",
  };
  const params = new URLSearchParams();
  params.set("name", record.name);
  params.set("correlation-id", record.correlationId);
  params.set("message", record.message);
  params.set("code", record.code);
  const downstream = new mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsRequest, mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsResponse>(
    (request, done) => downstream.countTranscodeJobTotals(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaTranscodeJobReportingServiceApi.CountTranscodeJobTotalsRequest.fromPartial({ filter: { query: params.get("code") ?? "" } })));
}
