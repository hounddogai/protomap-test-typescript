/**
 * Checks forums against the rules before anything acts on them.
 */

import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { ForumValidationWorkflow } from "../application/forum-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ForumValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ForumValidationHandler {
  constructor(@inject(ForumValidationWorkflow) private readonly workflow: ForumValidationWorkflow) {}

  /**
   * Checks a forum.
   */
  checkForumEligibility = (call: ServerUnaryCall<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse>, done: sendUnaryData<communityForumValidationServiceApi.CheckForumEligibilityResponse>): void => {
    void this.workflow.checkForumEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a forum.
   */
  explainForumDecision = unary<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse>(
    (request) => this.workflow.explainForumDecision(request),
  );

  /**
   * Returns a forum.
   */
  getForumRules = unary<communityForumValidationServiceApi.GetForumRulesRequest, communityForumValidationServiceApi.GetForumRulesResponse>(
    (request) => this.workflow.getForumRules(request),
  );

  /**
   * Lints a forum.
   */
  lintForums = (call: ServerUnaryCall<communityForumValidationServiceApi.LintForumsRequest, communityForumValidationServiceApi.LintForumsResponse>, done: sendUnaryData<communityForumValidationServiceApi.LintForumsResponse>): void => {
    void this.workflow.lintForums(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a forum.
   */
  normalizeForum = unary<communityForumValidationServiceApi.NormalizeForumRequest, communityForumValidationServiceApi.NormalizeForumResponse>(
    (request) => this.workflow.normalizeForum(request),
  );

  /**
   * Previews a forum.
   */
  previewForum = unary<communityForumValidationServiceApi.PreviewForumRequest, communityForumValidationServiceApi.PreviewForumResponse>(
    (request) => this.workflow.previewForum(request),
  );

  /**
   * Scores a forum.
   */
  scoreForum = (call: ServerUnaryCall<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse>, done: sendUnaryData<communityForumValidationServiceApi.ScoreForumResponse>): void => {
    void this.workflow.scoreForum(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a forum.
   */
  validateForum = unary<communityForumValidationServiceApi.ValidateForumRequest, communityForumValidationServiceApi.ValidateForumResponse>(
    (request) => this.workflow.validateForum(request),
  );
}

export function implementation(handler: ForumValidationHandler): communityForumValidationServiceApi.ForumValidationServiceServer {
  return {
    checkForumEligibility: handler.checkForumEligibility,
    explainForumDecision: handler.explainForumDecision,
    getForumRules: handler.getForumRules,
    lintForums: handler.lintForums,
    normalizeForum: handler.normalizeForum,
    previewForum: handler.previewForum,
    scoreForum: handler.scoreForum,
    validateForum: handler.validateForum,
  };
}
