/**
 * Checks audience syncs against the rules before anything acts on them.
 */

import * as audiencesAudienceSyncValidationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { AudienceSyncValidationWorkflow } from "./audience-sync-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for AudienceSyncValidationService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceSyncValidationHandler {
  constructor(@inject(AudienceSyncValidationWorkflow) private readonly workflow: AudienceSyncValidationWorkflow) {}

  /**
   * Explains an audience sync.
   */
  explainAudienceSyncDecision = unary<audiencesAudienceSyncValidationServiceApi.ExplainAudienceSyncDecisionRequest, audiencesAudienceSyncValidationServiceApi.ExplainAudienceSyncDecisionResponse>(
    (request) => this.workflow.explainAudienceSyncDecision(request),
  );

  /**
   * Returns an audience sync.
   */
  getAudienceSyncRules = (call: ServerUnaryCall<audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesRequest, audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesResponse>, done: sendUnaryData<audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesResponse>): void => {
    void this.workflow.getAudienceSyncRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints an audience sync.
   */
  lintAudienceSyncs = unary<audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsRequest, audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsResponse>(
    (request) => this.workflow.lintAudienceSyncs(request),
  );

  /**
   * Normalizes an audience sync.
   */
  normalizeAudienceSync = unary<audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.NormalizeAudienceSyncResponse>(
    (request) => this.workflow.normalizeAudienceSync(request),
  );

  /**
   * Previews an audience sync.
   */
  previewAudienceSync = (call: ServerUnaryCall<audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse>, done: sendUnaryData<audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse>): void => {
    void this.workflow.previewAudienceSync(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores an audience sync.
   */
  scoreAudienceSync = unary<audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncResponse>(
    (request) => this.workflow.scoreAudienceSync(request),
  );

  /**
   * Validates an audience sync.
   */
  validateAudienceSync = unary<audiencesAudienceSyncValidationServiceApi.ValidateAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.ValidateAudienceSyncResponse>(
    (request) => this.workflow.validateAudienceSync(request),
  );
}

export function implementation(handler: AudienceSyncValidationHandler): audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceServer {
  return {
    explainAudienceSyncDecision: handler.explainAudienceSyncDecision,
    getAudienceSyncRules: handler.getAudienceSyncRules,
    lintAudienceSyncs: handler.lintAudienceSyncs,
    normalizeAudienceSync: handler.normalizeAudienceSync,
    previewAudienceSync: handler.previewAudienceSync,
    scoreAudienceSync: handler.scoreAudienceSync,
    validateAudienceSync: handler.validateAudienceSync,
  };
}
