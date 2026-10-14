/**
 * Moves a transcode job between the states of its lifecycle.
 */

import * as mediaTranscodeJobLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { TranscodeJobLifecycleWorkflow } from "../application/transcode-job-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranscodeJobLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class TranscodeJobLifecycleHandler {
  constructor(@inject(TranscodeJobLifecycleWorkflow) private readonly workflow: TranscodeJobLifecycleWorkflow) {}

  /**
   * Activates a transcode job.
   */
  activateTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobLifecycleServiceApi.ActivateTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.ActivateTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobLifecycleServiceApi.ActivateTranscodeJobResponse>): void => {
    void this.workflow.activateTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a transcode job.
   */
  expireTranscodeJob = unary<mediaTranscodeJobLifecycleServiceApi.ExpireTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.ExpireTranscodeJobResponse>(
    (request) => this.workflow.expireTranscodeJob(request),
  );

  /**
   * Returns a transcode job.
   */
  getTranscodeJobLifecycle = unary<mediaTranscodeJobLifecycleServiceApi.GetTranscodeJobLifecycleRequest, mediaTranscodeJobLifecycleServiceApi.GetTranscodeJobLifecycleResponse>(
    (request) => this.workflow.getTranscodeJobLifecycle(request),
  );

  /**
   * Reinstates a transcode job.
   */
  reinstateTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobLifecycleServiceApi.ReinstateTranscodeJobResponse>): void => {
    void this.workflow.reinstateTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a transcode job.
   */
  renewTranscodeJob = unary<mediaTranscodeJobLifecycleServiceApi.RenewTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.RenewTranscodeJobResponse>(
    (request) => this.workflow.renewTranscodeJob(request),
  );

  /**
   * Schedules a transcode job.
   */
  scheduleTranscodeJobExpiry = unary<mediaTranscodeJobLifecycleServiceApi.ScheduleTranscodeJobExpiryRequest, mediaTranscodeJobLifecycleServiceApi.ScheduleTranscodeJobExpiryResponse>(
    (request) => this.workflow.scheduleTranscodeJobExpiry(request),
  );

  /**
   * Suspends a transcode job.
   */
  suspendTranscodeJob = (call: ServerUnaryCall<mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobResponse>, done: sendUnaryData<mediaTranscodeJobLifecycleServiceApi.SuspendTranscodeJobResponse>): void => {
    void this.workflow.suspendTranscodeJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a transcode job.
   */
  terminateTranscodeJob = unary<mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobRequest, mediaTranscodeJobLifecycleServiceApi.TerminateTranscodeJobResponse>(
    (request) => this.workflow.terminateTranscodeJob(request),
  );
}

export function implementation(handler: TranscodeJobLifecycleHandler): mediaTranscodeJobLifecycleServiceApi.TranscodeJobLifecycleServiceServer {
  return {
    activateTranscodeJob: handler.activateTranscodeJob,
    expireTranscodeJob: handler.expireTranscodeJob,
    getTranscodeJobLifecycle: handler.getTranscodeJobLifecycle,
    reinstateTranscodeJob: handler.reinstateTranscodeJob,
    renewTranscodeJob: handler.renewTranscodeJob,
    scheduleTranscodeJobExpiry: handler.scheduleTranscodeJobExpiry,
    suspendTranscodeJob: handler.suspendTranscodeJob,
    terminateTranscodeJob: handler.terminateTranscodeJob,
  };
}
