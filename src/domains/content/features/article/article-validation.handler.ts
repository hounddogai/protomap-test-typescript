/**
 * Checks articles against the rules before anything acts on them.
 */

import * as contentArticleValidationServiceApi from "../../../../../.cache/proto/acme/content/v1/article_validation_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ArticleValidationWorkflow } from "./article-validation.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ArticleValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ArticleValidationHandler {
  constructor(@inject(ArticleValidationWorkflow) private readonly workflow: ArticleValidationWorkflow) {}

  /**
   * Checks an article.
   */
  checkArticleEligibility = unary<contentArticleValidationServiceApi.CheckArticleEligibilityRequest, contentArticleValidationServiceApi.CheckArticleEligibilityResponse>(
    (request) => this.workflow.checkArticleEligibility(request),
  );

  /**
   * Explains an article.
   */
  explainArticleDecision = (call: ServerUnaryCall<contentArticleValidationServiceApi.ExplainArticleDecisionRequest, contentArticleValidationServiceApi.ExplainArticleDecisionResponse>, done: sendUnaryData<contentArticleValidationServiceApi.ExplainArticleDecisionResponse>): void => {
    void this.workflow.explainArticleDecision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an article.
   */
  getArticleRules = unary<contentArticleValidationServiceApi.GetArticleRulesRequest, contentArticleValidationServiceApi.GetArticleRulesResponse>(
    (request) => this.workflow.getArticleRules(request),
  );

  /**
   * Lints an article.
   */
  lintArticles = unary<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse>(
    (request) => this.workflow.lintArticles(request),
  );

  /**
   * Normalizes an article.
   */
  normalizeArticle = (call: ServerUnaryCall<contentArticleValidationServiceApi.NormalizeArticleRequest, contentArticleValidationServiceApi.NormalizeArticleResponse>, done: sendUnaryData<contentArticleValidationServiceApi.NormalizeArticleResponse>): void => {
    void this.workflow.normalizeArticle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Previews an article.
   */
  previewArticle = unary<contentArticleValidationServiceApi.PreviewArticleRequest, contentArticleValidationServiceApi.PreviewArticleResponse>(
    (request) => this.workflow.previewArticle(request),
  );

  /**
   * Scores an article.
   */
  scoreArticle = unary<contentArticleValidationServiceApi.ScoreArticleRequest, contentArticleValidationServiceApi.ScoreArticleResponse>(
    (request) => this.workflow.scoreArticle(request),
  );

  /**
   * Validates an article.
   */
  validateArticle = (call: ServerUnaryCall<contentArticleValidationServiceApi.ValidateArticleRequest, contentArticleValidationServiceApi.ValidateArticleResponse>, done: sendUnaryData<contentArticleValidationServiceApi.ValidateArticleResponse>): void => {
    void this.workflow.validateArticle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ArticleValidationHandler): contentArticleValidationServiceApi.ArticleValidationServiceServer {
  return {
    checkArticleEligibility: handler.checkArticleEligibility,
    explainArticleDecision: handler.explainArticleDecision,
    getArticleRules: handler.getArticleRules,
    lintArticles: handler.lintArticles,
    normalizeArticle: handler.normalizeArticle,
    previewArticle: handler.previewArticle,
    scoreArticle: handler.scoreArticle,
    validateArticle: handler.validateArticle,
  };
}
