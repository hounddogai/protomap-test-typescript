/**
 * Checks content revisions against the rules before anything acts on them.
 */

import * as contentContentRevisionValidationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ContentRevisionValidationWorkflow } from "./content-revision-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ContentRevisionValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ContentRevisionValidationHandler {
  constructor(@inject(ContentRevisionValidationWorkflow) private readonly workflow: ContentRevisionValidationWorkflow) {}

  /**
   * Checks a content revision.
   */
  checkContentRevisionEligibility = unary<contentContentRevisionValidationServiceApi.CheckContentRevisionEligibilityRequest, contentContentRevisionValidationServiceApi.CheckContentRevisionEligibilityResponse>(
    (request) => this.workflow.checkContentRevisionEligibility(request),
  );

  /**
   * Explains a content revision.
   */
  explainContentRevisionDecision = (call: ServerUnaryCall<contentContentRevisionValidationServiceApi.ExplainContentRevisionDecisionRequest, contentContentRevisionValidationServiceApi.ExplainContentRevisionDecisionResponse>, done: sendUnaryData<contentContentRevisionValidationServiceApi.ExplainContentRevisionDecisionResponse>): void => {
    void this.workflow.explainContentRevisionDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a content revision.
   */
  getContentRevisionRules = unary<contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest, contentContentRevisionValidationServiceApi.GetContentRevisionRulesResponse>(
    (request) => this.workflow.getContentRevisionRules(request),
  );

  /**
   * Lints a content revision.
   */
  lintContentRevisions = unary<contentContentRevisionValidationServiceApi.LintContentRevisionsRequest, contentContentRevisionValidationServiceApi.LintContentRevisionsResponse>(
    (request) => this.workflow.lintContentRevisions(request),
  );

  /**
   * Normalizes a content revision.
   */
  normalizeContentRevision = (call: ServerUnaryCall<contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest, contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse>, done: sendUnaryData<contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse>): void => {
    void this.workflow.normalizeContentRevision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews a content revision.
   */
  previewContentRevision = unary<contentContentRevisionValidationServiceApi.PreviewContentRevisionRequest, contentContentRevisionValidationServiceApi.PreviewContentRevisionResponse>(
    (request) => this.workflow.previewContentRevision(request),
  );

  /**
   * Scores a content revision.
   */
  scoreContentRevision = unary<contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest, contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse>(
    (request) => this.workflow.scoreContentRevision(request),
  );

  /**
   * Validates a content revision.
   */
  validateContentRevision = (call: ServerUnaryCall<contentContentRevisionValidationServiceApi.ValidateContentRevisionRequest, contentContentRevisionValidationServiceApi.ValidateContentRevisionResponse>, done: sendUnaryData<contentContentRevisionValidationServiceApi.ValidateContentRevisionResponse>): void => {
    void this.workflow.validateContentRevision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ContentRevisionValidationHandler): contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceServer {
  return {
    checkContentRevisionEligibility: handler.checkContentRevisionEligibility,
    explainContentRevisionDecision: handler.explainContentRevisionDecision,
    getContentRevisionRules: handler.getContentRevisionRules,
    lintContentRevisions: handler.lintContentRevisions,
    normalizeContentRevision: handler.normalizeContentRevision,
    previewContentRevision: handler.previewContentRevision,
    scoreContentRevision: handler.scoreContentRevision,
    validateContentRevision: handler.validateContentRevision,
  };
}
