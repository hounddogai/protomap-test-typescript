/**
 * Moves a translation job between the states of its lifecycle.
 */

import * as localizationTranslationJobLifecycleServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { TranslationJobLifecycleWorkflow } from "../application/translation-job-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TranslationJobLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class TranslationJobLifecycleHandler {
  constructor(@inject(TranslationJobLifecycleWorkflow) private readonly workflow: TranslationJobLifecycleWorkflow) {}

  /**
   * Activates a translation job.
   */
  activateTranslationJob = (call: ServerUnaryCall<localizationTranslationJobLifecycleServiceApi.ActivateTranslationJobRequest, localizationTranslationJobLifecycleServiceApi.ActivateTranslationJobResponse>, done: sendUnaryData<localizationTranslationJobLifecycleServiceApi.ActivateTranslationJobResponse>): void => {
    void this.workflow.activateTranslationJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a translation job.
   */
  expireTranslationJob = unary<localizationTranslationJobLifecycleServiceApi.ExpireTranslationJobRequest, localizationTranslationJobLifecycleServiceApi.ExpireTranslationJobResponse>(
    (request) => this.workflow.expireTranslationJob(request),
  );

  /**
   * Returns a translation job.
   */
  getTranslationJobLifecycle = unary<localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleRequest, localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleResponse>(
    (request) => this.workflow.getTranslationJobLifecycle(request),
  );

  /**
   * Reinstates a translation job.
   */
  reinstateTranslationJob = (call: ServerUnaryCall<localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobRequest, localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobResponse>, done: sendUnaryData<localizationTranslationJobLifecycleServiceApi.ReinstateTranslationJobResponse>): void => {
    void this.workflow.reinstateTranslationJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a translation job.
   */
  renewTranslationJob = unary<localizationTranslationJobLifecycleServiceApi.RenewTranslationJobRequest, localizationTranslationJobLifecycleServiceApi.RenewTranslationJobResponse>(
    (request) => this.workflow.renewTranslationJob(request),
  );

  /**
   * Schedules a translation job.
   */
  scheduleTranslationJobExpiry = unary<localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryRequest, localizationTranslationJobLifecycleServiceApi.ScheduleTranslationJobExpiryResponse>(
    (request) => this.workflow.scheduleTranslationJobExpiry(request),
  );

  /**
   * Suspends a translation job.
   */
  suspendTranslationJob = (call: ServerUnaryCall<localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobRequest, localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobResponse>, done: sendUnaryData<localizationTranslationJobLifecycleServiceApi.SuspendTranslationJobResponse>): void => {
    void this.workflow.suspendTranslationJob(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a translation job.
   */
  terminateTranslationJob = unary<localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobRequest, localizationTranslationJobLifecycleServiceApi.TerminateTranslationJobResponse>(
    (request) => this.workflow.terminateTranslationJob(request),
  );
}

export function implementation(handler: TranslationJobLifecycleHandler): localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceServer {
  return {
    activateTranslationJob: handler.activateTranslationJob,
    expireTranslationJob: handler.expireTranslationJob,
    getTranslationJobLifecycle: handler.getTranslationJobLifecycle,
    reinstateTranslationJob: handler.reinstateTranslationJob,
    renewTranslationJob: handler.renewTranslationJob,
    scheduleTranslationJobExpiry: handler.scheduleTranslationJobExpiry,
    suspendTranslationJob: handler.suspendTranslationJob,
    terminateTranslationJob: handler.terminateTranslationJob,
  };
}
