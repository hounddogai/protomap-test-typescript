/**
 * Moves a taxonomy between the states of its lifecycle.
 */

import * as contentTaxonomyLifecycleServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_lifecycle_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { TaxonomyLifecycleWorkflow } from "../application/taxonomy-lifecycle.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for TaxonomyLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class TaxonomyLifecycleHandler {
  constructor(@inject(TaxonomyLifecycleWorkflow) private readonly workflow: TaxonomyLifecycleWorkflow) {}

  /**
   * Activates a taxonomy.
   */
  activateTaxonomy = (call: ServerUnaryCall<contentTaxonomyLifecycleServiceApi.ActivateTaxonomyRequest, contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse>, done: sendUnaryData<contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse>): void => {
    void this.workflow.activateTaxonomy(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Expires a taxonomy.
   */
  expireTaxonomy = unary<contentTaxonomyLifecycleServiceApi.ExpireTaxonomyRequest, contentTaxonomyLifecycleServiceApi.ExpireTaxonomyResponse>(
    (request) => this.workflow.expireTaxonomy(request),
  );

  /**
   * Returns a taxonomy.
   */
  getTaxonomyLifecycle = unary<contentTaxonomyLifecycleServiceApi.GetTaxonomyLifecycleRequest, contentTaxonomyLifecycleServiceApi.GetTaxonomyLifecycleResponse>(
    (request) => this.workflow.getTaxonomyLifecycle(request),
  );

  /**
   * Reinstates a taxonomy.
   */
  reinstateTaxonomy = (call: ServerUnaryCall<contentTaxonomyLifecycleServiceApi.ReinstateTaxonomyRequest, contentTaxonomyLifecycleServiceApi.ReinstateTaxonomyResponse>, done: sendUnaryData<contentTaxonomyLifecycleServiceApi.ReinstateTaxonomyResponse>): void => {
    void this.workflow.reinstateTaxonomy(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Renews a taxonomy.
   */
  renewTaxonomy = unary<contentTaxonomyLifecycleServiceApi.RenewTaxonomyRequest, contentTaxonomyLifecycleServiceApi.RenewTaxonomyResponse>(
    (request) => this.workflow.renewTaxonomy(request),
  );

  /**
   * Schedules a taxonomy.
   */
  scheduleTaxonomyExpiry = unary<contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryRequest, contentTaxonomyLifecycleServiceApi.ScheduleTaxonomyExpiryResponse>(
    (request) => this.workflow.scheduleTaxonomyExpiry(request),
  );

  /**
   * Suspends a taxonomy.
   */
  suspendTaxonomy = (call: ServerUnaryCall<contentTaxonomyLifecycleServiceApi.SuspendTaxonomyRequest, contentTaxonomyLifecycleServiceApi.SuspendTaxonomyResponse>, done: sendUnaryData<contentTaxonomyLifecycleServiceApi.SuspendTaxonomyResponse>): void => {
    void this.workflow.suspendTaxonomy(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a taxonomy.
   */
  terminateTaxonomy = unary<contentTaxonomyLifecycleServiceApi.TerminateTaxonomyRequest, contentTaxonomyLifecycleServiceApi.TerminateTaxonomyResponse>(
    (request) => this.workflow.terminateTaxonomy(request),
  );
}

export function implementation(handler: TaxonomyLifecycleHandler): contentTaxonomyLifecycleServiceApi.TaxonomyLifecycleServiceServer {
  return {
    activateTaxonomy: handler.activateTaxonomy,
    expireTaxonomy: handler.expireTaxonomy,
    getTaxonomyLifecycle: handler.getTaxonomyLifecycle,
    reinstateTaxonomy: handler.reinstateTaxonomy,
    renewTaxonomy: handler.renewTaxonomy,
    scheduleTaxonomyExpiry: handler.scheduleTaxonomyExpiry,
    suspendTaxonomy: handler.suspendTaxonomy,
    terminateTaxonomy: handler.terminateTaxonomy,
  };
}
