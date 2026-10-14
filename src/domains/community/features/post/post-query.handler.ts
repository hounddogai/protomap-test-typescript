/**
 * Answers read-only questions about posts, for screens and reports.
 */

import * as communityPostQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/post_query_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { unary } from "../../../../platform/handlers.js";
import { PostQueryWorkflow } from "./post-query.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for PostQueryService; workflows own validation and database transactions.
 */
@injectable()
export class PostQueryHandler {
  constructor(@inject(PostQueryWorkflow) private readonly workflow: PostQueryWorkflow) {}

  /**
   * Lists posts a page at a time.
   */
  browsePosts = unary<communityPostQueryServiceApi.BrowsePostsRequest, communityPostQueryServiceApi.BrowsePostsResponse>(
    (request) => this.workflow.browsePosts(request),
  );

  /**
   * Counts posts by status.
   */
  countPosts = (call: ServerUnaryCall<communityPostQueryServiceApi.CountPostsRequest, communityPostQueryServiceApi.CountPostsResponse>, done: sendUnaryData<communityPostQueryServiceApi.CountPostsResponse>): void => {
    void this.workflow.countPosts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists posts a page at a time.
   */
  findPosts = unary<communityPostQueryServiceApi.FindPostsRequest, communityPostQueryServiceApi.FindPostsResponse>(
    (request) => this.workflow.findPosts(request),
  );

  /**
   * Returns a post.
   */
  lookupPost = unary<communityPostQueryServiceApi.LookupPostRequest, communityPostQueryServiceApi.LookupPostResponse>(
    (request) => this.workflow.lookupPost(request),
  );

  /**
   * Returns several posts at once.
   */
  resolvePosts = (call: ServerUnaryCall<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse>, done: sendUnaryData<communityPostQueryServiceApi.ResolvePostsResponse>): void => {
    void this.workflow.resolvePosts(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes a post.
   */
  summarizePosts = unary<communityPostQueryServiceApi.SummarizePostsRequest, communityPostQueryServiceApi.SummarizePostsResponse>(
    (request) => this.workflow.summarizePosts(request),
  );
}

export function implementation(handler: PostQueryHandler): communityPostQueryServiceApi.PostQueryServiceServer {
  return {
    browsePosts: handler.browsePosts,
    countPosts: handler.countPosts,
    findPosts: handler.findPosts,
    lookupPost: handler.lookupPost,
    resolvePosts: handler.resolvePosts,
    summarizePosts: handler.summarizePosts,
  };
}
