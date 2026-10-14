/**
 * Routes articles through approval, with escalation and delegation.
 */

import * as contentArticleApprovalServiceApi from "../../../../../.cache/proto/acme/content/v1/article_approval_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { ArticleApprovalWorkflow } from "./article-approval.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ArticleApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ArticleApprovalHandler {
  constructor(@inject(ArticleApprovalWorkflow) private readonly workflow: ArticleApprovalWorkflow) {}

  /**
   * Approves an article.
   */
  approveArticle = unary<contentArticleApprovalServiceApi.ApproveArticleRequest, contentArticleApprovalServiceApi.ApproveArticleResponse>(
    (request) => this.workflow.approveArticle(request),
  );

  /**
   * Delegates an article.
   */
  delegateArticleApproval = (call: ServerUnaryCall<contentArticleApprovalServiceApi.DelegateArticleApprovalRequest, contentArticleApprovalServiceApi.DelegateArticleApprovalResponse>, done: sendUnaryData<contentArticleApprovalServiceApi.DelegateArticleApprovalResponse>): void => {
    void this.workflow.delegateArticleApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates an article.
   */
  escalateArticle = unary<contentArticleApprovalServiceApi.EscalateArticleRequest, contentArticleApprovalServiceApi.EscalateArticleResponse>(
    (request) => this.workflow.escalateArticle(request),
  );

  /**
   * Returns an article.
   */
  getArticleApprovalStatus = unary<contentArticleApprovalServiceApi.GetArticleApprovalStatusRequest, contentArticleApprovalServiceApi.GetArticleApprovalStatusResponse>(
    (request) => this.workflow.getArticleApprovalStatus(request),
  );

  /**
   * Lists articles a page at a time.
   */
  listPendingArticles = (call: ServerUnaryCall<contentArticleApprovalServiceApi.ListPendingArticlesRequest, contentArticleApprovalServiceApi.ListPendingArticlesResponse>, done: sendUnaryData<contentArticleApprovalServiceApi.ListPendingArticlesResponse>): void => {
    void this.workflow.listPendingArticles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Rejects an article.
   */
  rejectArticle = unary<contentArticleApprovalServiceApi.RejectArticleRequest, contentArticleApprovalServiceApi.RejectArticleResponse>(
    (request) => this.workflow.rejectArticle(request),
  );

  /**
   * Submits an article.
   */
  submitArticle = unary<contentArticleApprovalServiceApi.SubmitArticleRequest, contentArticleApprovalServiceApi.SubmitArticleResponse>(
    (request) => this.workflow.submitArticle(request),
  );
}

export function implementation(handler: ArticleApprovalHandler): contentArticleApprovalServiceApi.ArticleApprovalServiceServer {
  return {
    approveArticle: handler.approveArticle,
    delegateArticleApproval: handler.delegateArticleApproval,
    escalateArticle: handler.escalateArticle,
    getArticleApprovalStatus: handler.getArticleApprovalStatus,
    listPendingArticles: handler.listPendingArticles,
    rejectArticle: handler.rejectArticle,
    submitArticle: handler.submitArticle,
  };
}
