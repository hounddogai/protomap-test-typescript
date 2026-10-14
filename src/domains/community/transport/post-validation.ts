/**
 * Checks posts against the rules before anything acts on them.
 */

import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import { serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { PostValidationWorkflow } from "../application/post-validation.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for PostValidationService; workflows own validation and database transactions.
 */
@injectable()
export class PostValidationHandler {
  constructor(@inject(PostValidationWorkflow) private readonly workflow: PostValidationWorkflow) {}

  /**
   * Checks a post.
   */
  checkPostEligibility = (call: ServerUnaryCall<communityPostValidationServiceApi.CheckPostEligibilityRequest, communityPostValidationServiceApi.CheckPostEligibilityResponse>, done: sendUnaryData<communityPostValidationServiceApi.CheckPostEligibilityResponse>): void => {
    void this.workflow.checkPostEligibility(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a post.
   */
  explainPostDecision = unary<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse>(
    (request) => this.workflow.explainPostDecision(request),
  );

  /**
   * Returns a post.
   */
  getPostRules = unary<communityPostValidationServiceApi.GetPostRulesRequest, communityPostValidationServiceApi.GetPostRulesResponse>(
    (request) => this.workflow.getPostRules(request),
  );

  /**
   * Lints a post.
   */
  lintPosts = (call: ServerUnaryCall<communityPostValidationServiceApi.LintPostsRequest, communityPostValidationServiceApi.LintPostsResponse>, done: sendUnaryData<communityPostValidationServiceApi.LintPostsResponse>): void => {
    void this.workflow.lintPosts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a post.
   */
  normalizePost = unary<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>(
    (request) => this.workflow.normalizePost(request),
  );

  /**
   * Previews a post.
   */
  previewPost = unary<communityPostValidationServiceApi.PreviewPostRequest, communityPostValidationServiceApi.PreviewPostResponse>(
    (request) => this.workflow.previewPost(request),
  );

  /**
   * Scores a post.
   */
  scorePost = (call: ServerUnaryCall<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse>, done: sendUnaryData<communityPostValidationServiceApi.ScorePostResponse>): void => {
    void this.workflow.scorePost(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a post.
   */
  validatePost = unary<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse>(
    (request) => this.workflow.validatePost(request),
  );
}

export function implementation(handler: PostValidationHandler): communityPostValidationServiceApi.PostValidationServiceServer {
  return {
    checkPostEligibility: handler.checkPostEligibility,
    explainPostDecision: handler.explainPostDecision,
    getPostRules: handler.getPostRules,
    lintPosts: handler.lintPosts,
    normalizePost: handler.normalizePost,
    previewPost: handler.previewPost,
    scorePost: handler.scorePost,
    validatePost: handler.validatePost,
  };
}
