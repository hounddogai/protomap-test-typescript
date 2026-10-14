/**
 * Moves a recommendation between the states of its lifecycle.
 */

import * as personalizationRecommendationLifecycleServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { RecommendationLifecycleWorkflow } from "./recommendation-lifecycle.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RecommendationLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class RecommendationLifecycleHandler {
  constructor(@inject(RecommendationLifecycleWorkflow) private readonly workflow: RecommendationLifecycleWorkflow) {}

  /**
   * Activates a recommendation.
   */
  activateRecommendation = unary<personalizationRecommendationLifecycleServiceApi.ActivateRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ActivateRecommendationResponse>(
    (request) => this.workflow.activateRecommendation(request),
  );

  /**
   * Expires a recommendation.
   */
  expireRecommendation = (call: ServerUnaryCall<personalizationRecommendationLifecycleServiceApi.ExpireRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse>, done: sendUnaryData<personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse>): void => {
    void this.workflow.expireRecommendation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a recommendation.
   */
  getRecommendationLifecycle = unary<personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleRequest, personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleResponse>(
    (request) => this.workflow.getRecommendationLifecycle(request),
  );

  /**
   * Reinstates a recommendation.
   */
  reinstateRecommendation = unary<personalizationRecommendationLifecycleServiceApi.ReinstateRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ReinstateRecommendationResponse>(
    (request) => this.workflow.reinstateRecommendation(request),
  );

  /**
   * Renews a recommendation.
   */
  renewRecommendation = (call: ServerUnaryCall<personalizationRecommendationLifecycleServiceApi.RenewRecommendationRequest, personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse>, done: sendUnaryData<personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse>): void => {
    void this.workflow.renewRecommendation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends a recommendation.
   */
  suspendRecommendation = unary<personalizationRecommendationLifecycleServiceApi.SuspendRecommendationRequest, personalizationRecommendationLifecycleServiceApi.SuspendRecommendationResponse>(
    (request) => this.workflow.suspendRecommendation(request),
  );

  /**
   * Terminates a recommendation.
   */
  terminateRecommendation = unary<personalizationRecommendationLifecycleServiceApi.TerminateRecommendationRequest, personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse>(
    (request) => this.workflow.terminateRecommendation(request),
  );
}

export function implementation(handler: RecommendationLifecycleHandler): personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceServer {
  return {
    activateRecommendation: handler.activateRecommendation,
    expireRecommendation: handler.expireRecommendation,
    getRecommendationLifecycle: handler.getRecommendationLifecycle,
    reinstateRecommendation: handler.reinstateRecommendation,
    renewRecommendation: handler.renewRecommendation,
    suspendRecommendation: handler.suspendRecommendation,
    terminateRecommendation: handler.terminateRecommendation,
  };
}
