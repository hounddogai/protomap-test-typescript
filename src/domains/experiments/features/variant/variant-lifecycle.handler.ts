/**
 * Moves a variant between the states of its lifecycle.
 */

import * as experimentsVariantLifecycleServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { VariantLifecycleWorkflow } from "./variant-lifecycle.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for VariantLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class VariantLifecycleHandler {
  constructor(@inject(VariantLifecycleWorkflow) private readonly workflow: VariantLifecycleWorkflow) {}

  /**
   * Activates a variant.
   */
  activateVariant = unary<experimentsVariantLifecycleServiceApi.ActivateVariantRequest, experimentsVariantLifecycleServiceApi.ActivateVariantResponse>(
    (request) => this.workflow.activateVariant(request),
  );

  /**
   * Expires a variant.
   */
  expireVariant = (call: ServerUnaryCall<experimentsVariantLifecycleServiceApi.ExpireVariantRequest, experimentsVariantLifecycleServiceApi.ExpireVariantResponse>, done: sendUnaryData<experimentsVariantLifecycleServiceApi.ExpireVariantResponse>): void => {
    void this.workflow.expireVariant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a variant.
   */
  getVariantLifecycle = unary<experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest, experimentsVariantLifecycleServiceApi.GetVariantLifecycleResponse>(
    (request) => this.workflow.getVariantLifecycle(request),
  );

  /**
   * Reinstates a variant.
   */
  reinstateVariant = unary<experimentsVariantLifecycleServiceApi.ReinstateVariantRequest, experimentsVariantLifecycleServiceApi.ReinstateVariantResponse>(
    (request) => this.workflow.reinstateVariant(request),
  );

  /**
   * Renews a variant.
   */
  renewVariant = (call: ServerUnaryCall<experimentsVariantLifecycleServiceApi.RenewVariantRequest, experimentsVariantLifecycleServiceApi.RenewVariantResponse>, done: sendUnaryData<experimentsVariantLifecycleServiceApi.RenewVariantResponse>): void => {
    void this.workflow.renewVariant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends a variant.
   */
  suspendVariant = unary<experimentsVariantLifecycleServiceApi.SuspendVariantRequest, experimentsVariantLifecycleServiceApi.SuspendVariantResponse>(
    (request) => this.workflow.suspendVariant(request),
  );

  /**
   * Terminates a variant.
   */
  terminateVariant = unary<experimentsVariantLifecycleServiceApi.TerminateVariantRequest, experimentsVariantLifecycleServiceApi.TerminateVariantResponse>(
    (request) => this.workflow.terminateVariant(request),
  );
}

export function implementation(handler: VariantLifecycleHandler): experimentsVariantLifecycleServiceApi.VariantLifecycleServiceServer {
  return {
    activateVariant: handler.activateVariant,
    expireVariant: handler.expireVariant,
    getVariantLifecycle: handler.getVariantLifecycle,
    reinstateVariant: handler.reinstateVariant,
    renewVariant: handler.renewVariant,
    suspendVariant: handler.suspendVariant,
    terminateVariant: handler.terminateVariant,
  };
}
