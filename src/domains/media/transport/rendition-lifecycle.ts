/**
 * Moves a rendition between the states of its lifecycle.
 */

import * as mediaRenditionLifecycleServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { RenditionLifecycleWorkflow } from "../application/rendition-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RenditionLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class RenditionLifecycleHandler {
  constructor(@inject(RenditionLifecycleWorkflow) private readonly workflow: RenditionLifecycleWorkflow) {}

  /**
   * Activates a rendition.
   */
  activateRendition = (call: ServerUnaryCall<mediaRenditionLifecycleServiceApi.ActivateRenditionRequest, mediaRenditionLifecycleServiceApi.ActivateRenditionResponse>, done: sendUnaryData<mediaRenditionLifecycleServiceApi.ActivateRenditionResponse>): void => {
    void this.workflow.activateRendition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a rendition.
   */
  expireRendition = unary<mediaRenditionLifecycleServiceApi.ExpireRenditionRequest, mediaRenditionLifecycleServiceApi.ExpireRenditionResponse>(
    (request) => this.workflow.expireRendition(request),
  );

  /**
   * Returns a rendition.
   */
  getRenditionLifecycle = unary<mediaRenditionLifecycleServiceApi.GetRenditionLifecycleRequest, mediaRenditionLifecycleServiceApi.GetRenditionLifecycleResponse>(
    (request) => this.workflow.getRenditionLifecycle(request),
  );

  /**
   * Reinstates a rendition.
   */
  reinstateRendition = (call: ServerUnaryCall<mediaRenditionLifecycleServiceApi.ReinstateRenditionRequest, mediaRenditionLifecycleServiceApi.ReinstateRenditionResponse>, done: sendUnaryData<mediaRenditionLifecycleServiceApi.ReinstateRenditionResponse>): void => {
    void this.workflow.reinstateRendition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a rendition.
   */
  renewRendition = unary<mediaRenditionLifecycleServiceApi.RenewRenditionRequest, mediaRenditionLifecycleServiceApi.RenewRenditionResponse>(
    (request) => this.workflow.renewRendition(request),
  );

  /**
   * Schedules a rendition.
   */
  scheduleRenditionExpiry = unary<mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryRequest, mediaRenditionLifecycleServiceApi.ScheduleRenditionExpiryResponse>(
    (request) => this.workflow.scheduleRenditionExpiry(request),
  );

  /**
   * Suspends a rendition.
   */
  suspendRendition = (call: ServerUnaryCall<mediaRenditionLifecycleServiceApi.SuspendRenditionRequest, mediaRenditionLifecycleServiceApi.SuspendRenditionResponse>, done: sendUnaryData<mediaRenditionLifecycleServiceApi.SuspendRenditionResponse>): void => {
    void this.workflow.suspendRendition(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a rendition.
   */
  terminateRendition = unary<mediaRenditionLifecycleServiceApi.TerminateRenditionRequest, mediaRenditionLifecycleServiceApi.TerminateRenditionResponse>(
    (request) => this.workflow.terminateRendition(request),
  );
}

export function implementation(handler: RenditionLifecycleHandler): mediaRenditionLifecycleServiceApi.RenditionLifecycleServiceServer {
  return {
    activateRendition: handler.activateRendition,
    expireRendition: handler.expireRendition,
    getRenditionLifecycle: handler.getRenditionLifecycle,
    reinstateRendition: handler.reinstateRendition,
    renewRendition: handler.renewRendition,
    scheduleRenditionExpiry: handler.scheduleRenditionExpiry,
    suspendRendition: handler.suspendRendition,
    terminateRendition: handler.terminateRendition,
  };
}
