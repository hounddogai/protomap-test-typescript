import * as audiencesAudienceMemberWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as mediaRenditionReportingServiceApi from "../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayPendingMediaAssetsId keeps of each ListPendingMediaAssets response. */
interface ReplayPendingMediaAssetsIdRecord {
  correlationId: string;
  status: string;
}

/** Where replayPendingMediaAssetsId hands each record. */
interface ReplayPendingMediaAssetsIdSink {
  apply(record: ReplayPendingMediaAssetsIdRecord): Promise<void>;
}

/** Hands records to acme.media.v1.RenditionReportingService. */
class ReplayPendingMediaAssetsIdRenditionReporting implements ReplayPendingMediaAssetsIdSink {
  private readonly client: mediaRenditionReportingServiceApi.RenditionReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionReportingServiceApi.RenditionReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ReplayPendingMediaAssetsIdRecord): Promise<void> {
    await call<mediaRenditionReportingServiceApi.GenerateRenditionReportRequest, mediaRenditionReportingServiceApi.GenerateRenditionReportResponse>(
      (request, done) => this.client.generateRenditionReport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaRenditionReportingServiceApi.GenerateRenditionReportRequest.fromPartial({ reason: record.status, renditionId: record.correlationId }));
  }
}

/** Writes records to acme.audiences.v1.AudienceMemberWorkflowService. */
class ReplayPendingMediaAssetsIdAudienceMemberWorkflow implements ReplayPendingMediaAssetsIdSink {
  private readonly client: audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ReplayPendingMediaAssetsIdRecord): Promise<void> {
    await call<audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowResponse>(
      (request, done) => this.client.resumeAudienceMemberWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceMemberWorkflowServiceApi.ResumeAudienceMemberWorkflowRequest.fromPartial({ details: { step: record.correlationId } }));
  }
}

/** Sends records to acme.personalization.v1.RecommendationWorkflowService. */
class ReplayPendingMediaAssetsIdRecommendationWorkflow implements ReplayPendingMediaAssetsIdSink {
  private readonly client: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ReplayPendingMediaAssetsIdRecord): Promise<void> {
    await call<personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowResponse>(
      (request, done) => this.client.advanceRecommendationWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationRecommendationWorkflowServiceApi.AdvanceRecommendationWorkflowRequest.fromPartial({ reason: record.correlationId }));
  }
}

/**
 * Reads acme.media.v1.MediaAssetApprovalService/ListPendingMediaAssets and hands what it keeps to the sink of
 * its kind.
 */
export async function replayPendingMediaAssetsId(runtime: Runtime): Promise<void> {
  const upstream = new mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsRequest, mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsResponse>(
    (request, done) => upstream.listPendingMediaAssets(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaMediaAssetApprovalServiceApi.ListPendingMediaAssetsRequest.fromPartial({ orderBy: "current-replay-pending-media-assets-id" }));
  const entry: ReplayPendingMediaAssetsIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    status: found.result?.status ?? "",
  };
  const sinks: ReplayPendingMediaAssetsIdSink[] = [
    new ReplayPendingMediaAssetsIdRenditionReporting(runtime),
    new ReplayPendingMediaAssetsIdAudienceMemberWorkflow(runtime),
    new ReplayPendingMediaAssetsIdRecommendationWorkflow(runtime),
  ];
  for (const sink of sinks) {
    await sink.apply(entry);
  }
}
