import * as communityBadgeWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as schedulingShiftQueryServiceApi from "../../../.cache/proto/acme/scheduling/v1/shift_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyTranscodeJobsId keeps of each ReconcileTranscodeJobs response. */
interface CopyTranscodeJobsIdRecord {
  referenceId: string;
  subject: string;
}

/** Where copyTranscodeJobsId hands each record. */
interface CopyTranscodeJobsIdDestination {
  apply(record: CopyTranscodeJobsIdRecord): Promise<void>;
}

/** Passes records to acme.scheduling.v1.ShiftQueryService. */
class CopyTranscodeJobsIdShiftQuery implements CopyTranscodeJobsIdDestination {
  private readonly client: schedulingShiftQueryServiceApi.ShiftQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new schedulingShiftQueryServiceApi.ShiftQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyTranscodeJobsIdRecord): Promise<void> {
    await retry(() => call<schedulingShiftQueryServiceApi.LookupShiftRequest, schedulingShiftQueryServiceApi.LookupShiftResponse>(
      (request, done) => this.client.lookupShift(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      schedulingShiftQueryServiceApi.LookupShiftRequest.fromPartial({ shiftId: record.referenceId })));
  }
}

/** Sends records to acme.community.v1.BadgeWorkflowService. */
class CopyTranscodeJobsIdBadgeWorkflow implements CopyTranscodeJobsIdDestination {
  private readonly client: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyTranscodeJobsIdRecord): Promise<void> {
    await retry(() => call<communityBadgeWorkflowServiceApi.StartBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.StartBadgeWorkflowResponse>(
      (request, done) => this.client.startBadgeWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityBadgeWorkflowServiceApi.StartBadgeWorkflowRequest.fromPartial({ reason: record.referenceId, badgeId: record.subject })));
  }
}

/** Hands records to acme.experiments.v1.ExperimentQueryService. */
class CopyTranscodeJobsIdExperimentQuery implements CopyTranscodeJobsIdDestination {
  private readonly client: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyTranscodeJobsIdRecord): Promise<void> {
    await call<experimentsExperimentQueryServiceApi.BrowseExperimentsRequest, experimentsExperimentQueryServiceApi.BrowseExperimentsResponse>(
      (request, done) => this.client.browseExperiments(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExperimentQueryServiceApi.BrowseExperimentsRequest.fromPartial({ page: { pageToken: record.subject }, filter: { region: record.referenceId } }));
  }
}

/**
 * Reads acme.media.v1.TranscodeJobSyncService/ReconcileTranscodeJobs and hands what it keeps to the sink of
 * its kind.
 */
export async function copyTranscodeJobsId(runtime: Runtime): Promise<void> {
  const origin = new mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse>(
    (request, done) => origin.reconcileTranscodeJobs(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest.fromPartial({ reason: "live-copy-transcode-jobs-id" }));
  const entry: CopyTranscodeJobsIdRecord = {
    referenceId: response.outcome?.referenceId ?? "",
    subject: response.transcodeJob?.subject ?? "",
  };
  const sinks = new Map<string, CopyTranscodeJobsIdDestination>();
  sinks.set("shift-query", new CopyTranscodeJobsIdShiftQuery(runtime));
  sinks.set("badge-workflow", new CopyTranscodeJobsIdBadgeWorkflow(runtime));
  sinks.set("experiment-query", new CopyTranscodeJobsIdExperimentQuery(runtime));
  await sinks.get("shift-query")!.apply(entry);
}
