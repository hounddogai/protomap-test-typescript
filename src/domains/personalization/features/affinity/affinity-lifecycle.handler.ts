/**
 * Moves an affinity between the states of its lifecycle.
 */

import * as personalizationAffinityLifecycleServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_lifecycle_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { AffinityLifecycleWorkflow } from "./affinity-lifecycle.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AffinityLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class AffinityLifecycleHandler {
  constructor(@inject(AffinityLifecycleWorkflow) private readonly workflow: AffinityLifecycleWorkflow) {}

  /**
   * Activates an affinity.
   */
  activateAffinity = unary<personalizationAffinityLifecycleServiceApi.ActivateAffinityRequest, personalizationAffinityLifecycleServiceApi.ActivateAffinityResponse>(
    (request) => this.workflow.activateAffinity(request),
  );

  /**
   * Expires an affinity.
   */
  expireAffinity = (call: ServerUnaryCall<personalizationAffinityLifecycleServiceApi.ExpireAffinityRequest, personalizationAffinityLifecycleServiceApi.ExpireAffinityResponse>, done: sendUnaryData<personalizationAffinityLifecycleServiceApi.ExpireAffinityResponse>): void => {
    void this.workflow.expireAffinity(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an affinity.
   */
  getAffinityLifecycle = unary<personalizationAffinityLifecycleServiceApi.GetAffinityLifecycleRequest, personalizationAffinityLifecycleServiceApi.GetAffinityLifecycleResponse>(
    (request) => this.workflow.getAffinityLifecycle(request),
  );

  /**
   * Renews an affinity.
   */
  renewAffinity = unary<personalizationAffinityLifecycleServiceApi.RenewAffinityRequest, personalizationAffinityLifecycleServiceApi.RenewAffinityResponse>(
    (request) => this.workflow.renewAffinity(request),
  );

  /**
   * Schedules an affinity.
   */
  scheduleAffinityExpiry = (call: ServerUnaryCall<personalizationAffinityLifecycleServiceApi.ScheduleAffinityExpiryRequest, personalizationAffinityLifecycleServiceApi.ScheduleAffinityExpiryResponse>, done: sendUnaryData<personalizationAffinityLifecycleServiceApi.ScheduleAffinityExpiryResponse>): void => {
    void this.workflow.scheduleAffinityExpiry(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends an affinity.
   */
  suspendAffinity = unary<personalizationAffinityLifecycleServiceApi.SuspendAffinityRequest, personalizationAffinityLifecycleServiceApi.SuspendAffinityResponse>(
    (request) => this.workflow.suspendAffinity(request),
  );

  /**
   * Terminates an affinity.
   */
  terminateAffinity = unary<personalizationAffinityLifecycleServiceApi.TerminateAffinityRequest, personalizationAffinityLifecycleServiceApi.TerminateAffinityResponse>(
    (request) => this.workflow.terminateAffinity(request),
  );
}

export function implementation(handler: AffinityLifecycleHandler): personalizationAffinityLifecycleServiceApi.AffinityLifecycleServiceServer {
  return {
    activateAffinity: handler.activateAffinity,
    expireAffinity: handler.expireAffinity,
    getAffinityLifecycle: handler.getAffinityLifecycle,
    renewAffinity: handler.renewAffinity,
    scheduleAffinityExpiry: handler.scheduleAffinityExpiry,
    suspendAffinity: handler.suspendAffinity,
    terminateAffinity: handler.terminateAffinity,
  };
}
