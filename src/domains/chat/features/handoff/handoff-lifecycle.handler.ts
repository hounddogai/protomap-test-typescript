/**
 * Moves a handoff between the states of its lifecycle.
 */

import * as chatHandoffLifecycleServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_lifecycle_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { HandoffLifecycleWorkflow } from "./handoff-lifecycle.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for HandoffLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class HandoffLifecycleHandler {
  constructor(@inject(HandoffLifecycleWorkflow) private readonly workflow: HandoffLifecycleWorkflow) {}

  /**
   * Activates a handoff.
   */
  activateHandoff = unary<chatHandoffLifecycleServiceApi.ActivateHandoffRequest, chatHandoffLifecycleServiceApi.ActivateHandoffResponse>(
    (request) => this.workflow.activateHandoff(request),
  );

  /**
   * Expires a handoff.
   */
  expireHandoff = (call: ServerUnaryCall<chatHandoffLifecycleServiceApi.ExpireHandoffRequest, chatHandoffLifecycleServiceApi.ExpireHandoffResponse>, done: sendUnaryData<chatHandoffLifecycleServiceApi.ExpireHandoffResponse>): void => {
    void this.workflow.expireHandoff(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a handoff.
   */
  getHandoffLifecycle = unary<chatHandoffLifecycleServiceApi.GetHandoffLifecycleRequest, chatHandoffLifecycleServiceApi.GetHandoffLifecycleResponse>(
    (request) => this.workflow.getHandoffLifecycle(request),
  );

  /**
   * Reinstates a handoff.
   */
  reinstateHandoff = unary<chatHandoffLifecycleServiceApi.ReinstateHandoffRequest, chatHandoffLifecycleServiceApi.ReinstateHandoffResponse>(
    (request) => this.workflow.reinstateHandoff(request),
  );

  /**
   * Renews a handoff.
   */
  renewHandoff = (call: ServerUnaryCall<chatHandoffLifecycleServiceApi.RenewHandoffRequest, chatHandoffLifecycleServiceApi.RenewHandoffResponse>, done: sendUnaryData<chatHandoffLifecycleServiceApi.RenewHandoffResponse>): void => {
    void this.workflow.renewHandoff(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Schedules a handoff.
   */
  scheduleHandoffExpiry = unary<chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryRequest, chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryResponse>(
    (request) => this.workflow.scheduleHandoffExpiry(request),
  );

  /**
   * Suspends a handoff.
   */
  suspendHandoff = unary<chatHandoffLifecycleServiceApi.SuspendHandoffRequest, chatHandoffLifecycleServiceApi.SuspendHandoffResponse>(
    (request) => this.workflow.suspendHandoff(request),
  );
}

export function implementation(handler: HandoffLifecycleHandler): chatHandoffLifecycleServiceApi.HandoffLifecycleServiceServer {
  return {
    activateHandoff: handler.activateHandoff,
    expireHandoff: handler.expireHandoff,
    getHandoffLifecycle: handler.getHandoffLifecycle,
    reinstateHandoff: handler.reinstateHandoff,
    renewHandoff: handler.renewHandoff,
    scheduleHandoffExpiry: handler.scheduleHandoffExpiry,
    suspendHandoff: handler.suspendHandoff,
  };
}
