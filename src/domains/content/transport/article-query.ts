/**
 * Answers read-only questions about articles, for screens and reports.
 */

import * as contentArticleQueryServiceApi from "../../../../.cache/proto/acme/content/v1/article_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { ArticleQueryWorkflow } from "../application/article-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ArticleQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ArticleQueryHandler {
  constructor(@inject(ArticleQueryWorkflow) private readonly workflow: ArticleQueryWorkflow) {}

  /**
   * Lists articles a page at a time.
   */
  browseArticles = (call: ServerUnaryCall<contentArticleQueryServiceApi.BrowseArticlesRequest, contentArticleQueryServiceApi.BrowseArticlesResponse>, done: sendUnaryData<contentArticleQueryServiceApi.BrowseArticlesResponse>): void => {
    void this.workflow.browseArticles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts articles by status.
   */
  countArticles = unary<contentArticleQueryServiceApi.CountArticlesRequest, contentArticleQueryServiceApi.CountArticlesResponse>(
    (request) => this.workflow.countArticles(request),
  );

  /**
   * Streams every matching article.
   */
  exportArticles = serverStream<contentArticleQueryServiceApi.ExportArticlesRequest, contentArticleQueryServiceApi.ExportArticlesResponse>(
    (request) => this.workflow.exportArticles(request),
  );

  /**
   * Lists articles a page at a time.
   */
  findArticles = (call: ServerUnaryCall<contentArticleQueryServiceApi.FindArticlesRequest, contentArticleQueryServiceApi.FindArticlesResponse>, done: sendUnaryData<contentArticleQueryServiceApi.FindArticlesResponse>): void => {
    void this.workflow.findArticles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an article.
   */
  lookupArticle = unary<contentArticleQueryServiceApi.LookupArticleRequest, contentArticleQueryServiceApi.LookupArticleResponse>(
    (request) => this.workflow.lookupArticle(request),
  );

  /**
   * Returns an article.
   */
  peekArticle = unary<contentArticleQueryServiceApi.PeekArticleRequest, contentArticleQueryServiceApi.PeekArticleResponse>(
    (request) => this.workflow.peekArticle(request),
  );

  /**
   * Returns several articles at once.
   */
  resolveArticles = (call: ServerUnaryCall<contentArticleQueryServiceApi.ResolveArticlesRequest, contentArticleQueryServiceApi.ResolveArticlesResponse>, done: sendUnaryData<contentArticleQueryServiceApi.ResolveArticlesResponse>): void => {
    void this.workflow.resolveArticles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists articles a page at a time.
   */
  suggestArticles = unary<contentArticleQueryServiceApi.SuggestArticlesRequest, contentArticleQueryServiceApi.SuggestArticlesResponse>(
    (request) => this.workflow.suggestArticles(request),
  );

  /**
   * Summarizes an article.
   */
  summarizeArticles = unary<contentArticleQueryServiceApi.SummarizeArticlesRequest, contentArticleQueryServiceApi.SummarizeArticlesResponse>(
    (request) => this.workflow.summarizeArticles(request),
  );
}

export function implementation(handler: ArticleQueryHandler): contentArticleQueryServiceApi.ArticleQueryServiceServer {
  return {
    browseArticles: handler.browseArticles,
    countArticles: handler.countArticles,
    exportArticles: handler.exportArticles,
    findArticles: handler.findArticles,
    lookupArticle: handler.lookupArticle,
    peekArticle: handler.peekArticle,
    resolveArticles: handler.resolveArticles,
    suggestArticles: handler.suggestArticles,
    summarizeArticles: handler.summarizeArticles,
  };
}
