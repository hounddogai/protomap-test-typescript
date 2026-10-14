/**
 * Computes the figures of an audience sync, such as totals, taxes, and estimates.
 */

import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { AudienceSyncCalculationWorkflow } from "../application/audience-sync-calculation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceSyncCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceSyncCalculationHandler {
  constructor(@inject(AudienceSyncCalculationWorkflow) private readonly workflow: AudienceSyncCalculationWorkflow) {}

  /**
   * Calculates an audience sync.
   */
  calculateAudienceSync = (call: ServerUnaryCall<audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse>, done: sendUnaryData<audiencesAudienceSyncCalculationServiceApi.CalculateAudienceSyncResponse>): void => {
    void this.workflow.calculateAudienceSync(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Compares an audience sync.
   */
  compareAudienceSyncOptions = unary<audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsRequest, audiencesAudienceSyncCalculationServiceApi.CompareAudienceSyncOptionsResponse>(
    (request) => this.workflow.compareAudienceSyncOptions(request),
  );

  /**
   * Estimates an audience sync.
   */
  estimateAudienceSync = unary<audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse>(
    (request) => this.workflow.estimateAudienceSync(request),
  );

  /**
   * Explains an audience sync.
   */
  explainAudienceSyncCalculation = (call: ServerUnaryCall<audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationRequest, audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse>, done: sendUnaryData<audiencesAudienceSyncCalculationServiceApi.ExplainAudienceSyncCalculationResponse>): void => {
    void this.workflow.explainAudienceSyncCalculation(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes an audience sync.
   */
  quoteAudienceSync = unary<audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.QuoteAudienceSyncResponse>(
    (request) => this.workflow.quoteAudienceSync(request),
  );

  /**
   * Recalculates an audience sync.
   */
  recalculateAudienceSyncs = unary<audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsRequest, audiencesAudienceSyncCalculationServiceApi.RecalculateAudienceSyncsResponse>(
    (request) => this.workflow.recalculateAudienceSyncs(request),
  );

  /**
   * Simulates an audience sync.
   */
  simulateAudienceSync = (call: ServerUnaryCall<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse>, done: sendUnaryData<audiencesAudienceSyncCalculationServiceApi.SimulateAudienceSyncResponse>): void => {
    void this.workflow.simulateAudienceSync(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: AudienceSyncCalculationHandler): audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceServer {
  return {
    calculateAudienceSync: handler.calculateAudienceSync,
    compareAudienceSyncOptions: handler.compareAudienceSyncOptions,
    estimateAudienceSync: handler.estimateAudienceSync,
    explainAudienceSyncCalculation: handler.explainAudienceSyncCalculation,
    quoteAudienceSync: handler.quoteAudienceSync,
    recalculateAudienceSyncs: handler.recalculateAudienceSyncs,
    simulateAudienceSync: handler.simulateAudienceSync,
  };
}
