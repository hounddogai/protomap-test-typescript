/**
 * Computes the figures of a profile, such as totals, taxes, and estimates.
 */

import * as personalizationProfileCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ProfileCalculationWorkflow } from "./profile-calculation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ProfileCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ProfileCalculationHandler {
  constructor(@inject(ProfileCalculationWorkflow) private readonly workflow: ProfileCalculationWorkflow) {}

  /**
   * Calculates a profile.
   */
  calculateProfile = unary<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(
    (request) => this.workflow.calculateProfile(request),
  );

  /**
   * Estimates a profile.
   */
  estimateProfile = (call: ServerUnaryCall<personalizationProfileCalculationServiceApi.EstimateProfileRequest, personalizationProfileCalculationServiceApi.EstimateProfileResponse>, done: sendUnaryData<personalizationProfileCalculationServiceApi.EstimateProfileResponse>): void => {
    void this.workflow.estimateProfile(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a profile.
   */
  explainProfileCalculation = unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(
    (request) => this.workflow.explainProfileCalculation(request),
  );

  /**
   * Returns a profile.
   */
  getProfileRates = unary<personalizationProfileCalculationServiceApi.GetProfileRatesRequest, personalizationProfileCalculationServiceApi.GetProfileRatesResponse>(
    (request) => this.workflow.getProfileRates(request),
  );

  /**
   * Recalculates a profile.
   */
  recalculateProfiles = (call: ServerUnaryCall<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>, done: sendUnaryData<personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>): void => {
    void this.workflow.recalculateProfiles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a profile.
   */
  simulateProfile = unary<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse>(
    (request) => this.workflow.simulateProfile(request),
  );
}

export function implementation(handler: ProfileCalculationHandler): personalizationProfileCalculationServiceApi.ProfileCalculationServiceServer {
  return {
    calculateProfile: handler.calculateProfile,
    estimateProfile: handler.estimateProfile,
    explainProfileCalculation: handler.explainProfileCalculation,
    getProfileRates: handler.getProfileRates,
    recalculateProfiles: handler.recalculateProfiles,
    simulateProfile: handler.simulateProfile,
  };
}
