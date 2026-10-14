/**
 * Answers read-only questions about recommendations, for screens and reports.
 */

import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { RecommendationQueryWorkflow } from "../application/recommendation-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for RecommendationQueryService; workflows own validation and database transactions.
 */
@injectable()
export class RecommendationQueryHandler {
  constructor(@inject(RecommendationQueryWorkflow) private readonly workflow: RecommendationQueryWorkflow) {}

  /**
   * Lists recommendations a page at a time.
   */
  browseRecommendations = (call: ServerUnaryCall<personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest, personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse>, done: sendUnaryData<personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse>): void => {
    void this.workflow.browseRecommendations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts recommendations by status.
   */
  countRecommendations = unary<personalizationRecommendationQueryServiceApi.CountRecommendationsRequest, personalizationRecommendationQueryServiceApi.CountRecommendationsResponse>(
    (request) => this.workflow.countRecommendations(request),
  );

  /**
   * Streams every matching recommendation.
   */
  exportRecommendations = serverStream<personalizationRecommendationQueryServiceApi.ExportRecommendationsRequest, personalizationRecommendationQueryServiceApi.ExportRecommendationsResponse>(
    (request) => this.workflow.exportRecommendations(request),
  );

  /**
   * Lists recommendations a page at a time.
   */
  findRecommendations = (call: ServerUnaryCall<personalizationRecommendationQueryServiceApi.FindRecommendationsRequest, personalizationRecommendationQueryServiceApi.FindRecommendationsResponse>, done: sendUnaryData<personalizationRecommendationQueryServiceApi.FindRecommendationsResponse>): void => {
    void this.workflow.findRecommendations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a recommendation.
   */
  lookupRecommendation = unary<personalizationRecommendationQueryServiceApi.LookupRecommendationRequest, personalizationRecommendationQueryServiceApi.LookupRecommendationResponse>(
    (request) => this.workflow.lookupRecommendation(request),
  );

  /**
   * Returns a recommendation.
   */
  peekRecommendation = unary<personalizationRecommendationQueryServiceApi.PeekRecommendationRequest, personalizationRecommendationQueryServiceApi.PeekRecommendationResponse>(
    (request) => this.workflow.peekRecommendation(request),
  );

  /**
   * Returns several recommendations at once.
   */
  resolveRecommendations = (call: ServerUnaryCall<personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest, personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse>, done: sendUnaryData<personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse>): void => {
    void this.workflow.resolveRecommendations(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists recommendations a page at a time.
   */
  suggestRecommendations = unary<personalizationRecommendationQueryServiceApi.SuggestRecommendationsRequest, personalizationRecommendationQueryServiceApi.SuggestRecommendationsResponse>(
    (request) => this.workflow.suggestRecommendations(request),
  );

  /**
   * Summarizes a recommendation.
   */
  summarizeRecommendations = unary<personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest, personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse>(
    (request) => this.workflow.summarizeRecommendations(request),
  );
}

export function implementation(handler: RecommendationQueryHandler): personalizationRecommendationQueryServiceApi.RecommendationQueryServiceServer {
  return {
    browseRecommendations: handler.browseRecommendations,
    countRecommendations: handler.countRecommendations,
    exportRecommendations: handler.exportRecommendations,
    findRecommendations: handler.findRecommendations,
    lookupRecommendation: handler.lookupRecommendation,
    peekRecommendation: handler.peekRecommendation,
    resolveRecommendations: handler.resolveRecommendations,
    suggestRecommendations: handler.suggestRecommendations,
    summarizeRecommendations: handler.summarizeRecommendations,
  };
}
