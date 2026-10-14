/**
 * Moves a badge between the states of its lifecycle.
 */

import * as communityBadgeLifecycleServiceApi from "../../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { BadgeLifecycleWorkflow } from "../application/badge-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for BadgeLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class BadgeLifecycleHandler {
  constructor(@inject(BadgeLifecycleWorkflow) private readonly workflow: BadgeLifecycleWorkflow) {}

  /**
   * Activates a badge.
   */
  activateBadge = (call: ServerUnaryCall<communityBadgeLifecycleServiceApi.ActivateBadgeRequest, communityBadgeLifecycleServiceApi.ActivateBadgeResponse>, done: sendUnaryData<communityBadgeLifecycleServiceApi.ActivateBadgeResponse>): void => {
    void this.workflow.activateBadge(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a badge.
   */
  expireBadge = unary<communityBadgeLifecycleServiceApi.ExpireBadgeRequest, communityBadgeLifecycleServiceApi.ExpireBadgeResponse>(
    (request) => this.workflow.expireBadge(request),
  );

  /**
   * Returns a badge.
   */
  getBadgeLifecycle = unary<communityBadgeLifecycleServiceApi.GetBadgeLifecycleRequest, communityBadgeLifecycleServiceApi.GetBadgeLifecycleResponse>(
    (request) => this.workflow.getBadgeLifecycle(request),
  );

  /**
   * Reinstates a badge.
   */
  reinstateBadge = (call: ServerUnaryCall<communityBadgeLifecycleServiceApi.ReinstateBadgeRequest, communityBadgeLifecycleServiceApi.ReinstateBadgeResponse>, done: sendUnaryData<communityBadgeLifecycleServiceApi.ReinstateBadgeResponse>): void => {
    void this.workflow.reinstateBadge(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a badge.
   */
  renewBadge = unary<communityBadgeLifecycleServiceApi.RenewBadgeRequest, communityBadgeLifecycleServiceApi.RenewBadgeResponse>(
    (request) => this.workflow.renewBadge(request),
  );

  /**
   * Schedules a badge.
   */
  scheduleBadgeExpiry = unary<communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest, communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse>(
    (request) => this.workflow.scheduleBadgeExpiry(request),
  );

  /**
   * Suspends a badge.
   */
  suspendBadge = (call: ServerUnaryCall<communityBadgeLifecycleServiceApi.SuspendBadgeRequest, communityBadgeLifecycleServiceApi.SuspendBadgeResponse>, done: sendUnaryData<communityBadgeLifecycleServiceApi.SuspendBadgeResponse>): void => {
    void this.workflow.suspendBadge(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: BadgeLifecycleHandler): communityBadgeLifecycleServiceApi.BadgeLifecycleServiceServer {
  return {
    activateBadge: handler.activateBadge,
    expireBadge: handler.expireBadge,
    getBadgeLifecycle: handler.getBadgeLifecycle,
    reinstateBadge: handler.reinstateBadge,
    renewBadge: handler.renewBadge,
    scheduleBadgeExpiry: handler.scheduleBadgeExpiry,
    suspendBadge: handler.suspendBadge,
  };
}
