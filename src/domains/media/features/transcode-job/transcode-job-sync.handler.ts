/**
 * Keeps transcode jobs in step with the systems of record in other regions.
 */

import * as mediaTranscodeJobSyncServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { duplex, unary } from "../../../../platform/handlers.js";
import { TranscodeJobSyncWorkflow } from "./transcode-job-sync.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranscodeJobSyncService; workflows own validation and database transactions.
 */
@injectable()
export class TranscodeJobSyncHandler {
  constructor(@inject(TranscodeJobSyncWorkflow) private readonly workflow: TranscodeJobSyncWorkflow) {}

  /**
   * Returns a transcode job.
   */
  getTranscodeJobSyncState = unary<mediaTranscodeJobSyncServiceApi.GetTranscodeJobSyncStateRequest, mediaTranscodeJobSyncServiceApi.GetTranscodeJobSyncStateResponse>(
    (request) => this.workflow.getTranscodeJobSyncState(request),
  );

  /**
   * Lists transcode jobs a page at a time.
   */
  listTranscodeJobConflicts = (call: ServerUnaryCall<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest, mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse>, done: sendUnaryData<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse>): void => {
    void this.workflow.listTranscodeJobConflicts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pulls a transcode job.
   */
  pullTranscodeJobs = unary<mediaTranscodeJobSyncServiceApi.PullTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.PullTranscodeJobsResponse>(
    (request) => this.workflow.pullTranscodeJobs(request),
  );

  /**
   * Pushs a transcode job.
   */
  pushTranscodeJob = unary<mediaTranscodeJobSyncServiceApi.PushTranscodeJobRequest, mediaTranscodeJobSyncServiceApi.PushTranscodeJobResponse>(
    (request) => this.workflow.pushTranscodeJob(request),
  );

  /**
   * Reconciles a transcode job.
   */
  reconcileTranscodeJobs = (call: ServerUnaryCall<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse>, done: sendUnaryData<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse>): void => {
    void this.workflow.reconcileTranscodeJobs(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Resolves a transcode job.
   */
  resolveTranscodeJobConflict = unary<mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictRequest, mediaTranscodeJobSyncServiceApi.ResolveTranscodeJobConflictResponse>(
    (request) => this.workflow.resolveTranscodeJobConflict(request),
  );

  /**
   * Exchanges changes of transcode jobs with a peer.
   */
  streamTranscodeJobChanges = duplex<mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesRequest, mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesResponse>(
    (request) => this.workflow.streamTranscodeJobChanges(request),
  );

  /**
   * Syncs a transcode job.
   */
  syncTranscodeJobs = (call: ServerUnaryCall<mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsResponse>, done: sendUnaryData<mediaTranscodeJobSyncServiceApi.SyncTranscodeJobsResponse>): void => {
    void this.workflow.syncTranscodeJobs(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: TranscodeJobSyncHandler): mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceServer {
  return {
    getTranscodeJobSyncState: handler.getTranscodeJobSyncState,
    listTranscodeJobConflicts: handler.listTranscodeJobConflicts,
    pullTranscodeJobs: handler.pullTranscodeJobs,
    pushTranscodeJob: handler.pushTranscodeJob,
    reconcileTranscodeJobs: handler.reconcileTranscodeJobs,
    resolveTranscodeJobConflict: handler.resolveTranscodeJobConflict,
    streamTranscodeJobChanges: handler.streamTranscodeJobChanges,
    syncTranscodeJobs: handler.syncTranscodeJobs,
  };
}
