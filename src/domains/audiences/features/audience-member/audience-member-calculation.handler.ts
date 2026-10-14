/**
 * Computes the figures of an audience member, such as totals, taxes, and estimates.
 */

import * as audiencesAudienceMemberCalculationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { AudienceMemberCalculationWorkflow } from "./audience-member-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceMemberCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceMemberCalculationHandler {
  constructor(@inject(AudienceMemberCalculationWorkflow) private readonly workflow: AudienceMemberCalculationWorkflow) {}

  /**
   * Calculates an audience member.
   */
  calculateAudienceMember = unary<audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.CalculateAudienceMemberResponse>(
    (request) => this.workflow.calculateAudienceMember(request),
  );

  /**
   * Compares an audience member.
   */
  compareAudienceMemberOptions = (call: ServerUnaryCall<audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsRequest, audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse>, done: sendUnaryData<audiencesAudienceMemberCalculationServiceApi.CompareAudienceMemberOptionsResponse>): void => {
    void this.workflow.compareAudienceMemberOptions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Estimates an audience member.
   */
  estimateAudienceMember = unary<audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.EstimateAudienceMemberResponse>(
    (request) => this.workflow.estimateAudienceMember(request),
  );

  /**
   * Explains an audience member.
   */
  explainAudienceMemberCalculation = unary<audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationRequest, audiencesAudienceMemberCalculationServiceApi.ExplainAudienceMemberCalculationResponse>(
    (request) => this.workflow.explainAudienceMemberCalculation(request),
  );

  /**
   * Returns an audience member.
   */
  getAudienceMemberRates = (call: ServerUnaryCall<audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest, audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse>, done: sendUnaryData<audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse>): void => {
    void this.workflow.getAudienceMemberRates(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Quotes an audience member.
   */
  quoteAudienceMember = unary<audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.QuoteAudienceMemberResponse>(
    (request) => this.workflow.quoteAudienceMember(request),
  );

  /**
   * Simulates an audience member.
   */
  simulateAudienceMember = unary<audiencesAudienceMemberCalculationServiceApi.SimulateAudienceMemberRequest, audiencesAudienceMemberCalculationServiceApi.SimulateAudienceMemberResponse>(
    (request) => this.workflow.simulateAudienceMember(request),
  );
}

export function implementation(handler: AudienceMemberCalculationHandler): audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceServer {
  return {
    calculateAudienceMember: handler.calculateAudienceMember,
    compareAudienceMemberOptions: handler.compareAudienceMemberOptions,
    estimateAudienceMember: handler.estimateAudienceMember,
    explainAudienceMemberCalculation: handler.explainAudienceMemberCalculation,
    getAudienceMemberRates: handler.getAudienceMemberRates,
    quoteAudienceMember: handler.quoteAudienceMember,
    simulateAudienceMember: handler.simulateAudienceMember,
  };
}
