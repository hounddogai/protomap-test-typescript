import * as audiencesAudienceSyncValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as mediaMediaAssetReportingServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyMediaAssetReportName keeps of each ShareMediaAssetReport response. */
interface CopyMediaAssetReportNameRecord {
  name: string;
  mediaAssetId: string;
  code: string;
  status: string;
}

/** Where copyMediaAssetReportName hands each record. */
interface CopyMediaAssetReportNameSink {
  apply(record: CopyMediaAssetReportNameRecord): Promise<void>;
}

/** Passes records to acme.audiences.v1.AudienceSyncValidationService. */
class CopyMediaAssetReportNameAudienceSyncValidation implements CopyMediaAssetReportNameSink {
  private readonly client: audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyMediaAssetReportNameRecord): Promise<void> {
    await call<audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesRequest, audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesResponse>(
      (request, done) => this.client.getAudienceSyncRules(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesRequest.fromPartial({ audienceSyncId: record.status }));
  }
}

/** Sends records to acme.media.v1.TranscodeJobApprovalService. */
class CopyMediaAssetReportNameTranscodeJobApproval implements CopyMediaAssetReportNameSink {
  private readonly client: mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyMediaAssetReportNameRecord): Promise<void> {
    await call<mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest, mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse>(
      (request, done) => this.client.commentTranscodeJobApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest.fromPartial({ details: { approverEmail: record.status } }));
  }
}

/** Runs the action registered for kind. */
async function actOnCopyMediaAssetReportName(kind: string, record: CopyMediaAssetReportNameRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "audience-sync-validation": () => new CopyMediaAssetReportNameAudienceSyncValidation(runtime).apply(record),
    "transcode-job-approval": () => new CopyMediaAssetReportNameTranscodeJobApproval(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.media.v1.MediaAssetReportingService/ShareMediaAssetReport and hands what it keeps to the sink of
 * its kind.
 */
export async function copyMediaAssetReportName(runtime: Runtime): Promise<void> {
  const origin = new mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<mediaMediaAssetReportingServiceApi.ShareMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ShareMediaAssetReportResponse>(
    (request, done) => origin.shareMediaAssetReport(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaMediaAssetReportingServiceApi.ShareMediaAssetReportRequest.fromPartial({ mediaAssetId: "main-copy-media-asset-report-name" }));
  const row: CopyMediaAssetReportNameRecord = {
    name: reply.mediaAsset?.name ?? "",
    mediaAssetId: reply.mediaAsset?.mediaAssetId ?? "",
    code: reply.mediaAsset?.code ?? "",
    status: reply.outcome?.status ?? "",
  };
  await actOnCopyMediaAssetReportName("audience-sync-validation", row, runtime);
}
