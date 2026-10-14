/**
 * Answers read-only questions about content blocks, for screens and reports.
 */

import * as contentContentBlockQueryServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import { serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { ContentBlockQueryWorkflow } from "../application/content-block-query.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ContentBlockQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ContentBlockQueryHandler {
  constructor(@inject(ContentBlockQueryWorkflow) private readonly workflow: ContentBlockQueryWorkflow) {}

  /**
   * Lists content blocks a page at a time.
   */
  browseContentBlocks = (call: ServerUnaryCall<contentContentBlockQueryServiceApi.BrowseContentBlocksRequest, contentContentBlockQueryServiceApi.BrowseContentBlocksResponse>, done: sendUnaryData<contentContentBlockQueryServiceApi.BrowseContentBlocksResponse>): void => {
    void this.workflow.browseContentBlocks(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Counts content blocks by status.
   */
  countContentBlocks = unary<contentContentBlockQueryServiceApi.CountContentBlocksRequest, contentContentBlockQueryServiceApi.CountContentBlocksResponse>(
    (request) => this.workflow.countContentBlocks(request),
  );

  /**
   * Streams every matching content block.
   */
  exportContentBlocks = serverStream<contentContentBlockQueryServiceApi.ExportContentBlocksRequest, contentContentBlockQueryServiceApi.ExportContentBlocksResponse>(
    (request) => this.workflow.exportContentBlocks(request),
  );

  /**
   * Returns a content block.
   */
  lookupContentBlock = (call: ServerUnaryCall<contentContentBlockQueryServiceApi.LookupContentBlockRequest, contentContentBlockQueryServiceApi.LookupContentBlockResponse>, done: sendUnaryData<contentContentBlockQueryServiceApi.LookupContentBlockResponse>): void => {
    void this.workflow.lookupContentBlock(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a content block.
   */
  peekContentBlock = unary<contentContentBlockQueryServiceApi.PeekContentBlockRequest, contentContentBlockQueryServiceApi.PeekContentBlockResponse>(
    (request) => this.workflow.peekContentBlock(request),
  );

  /**
   * Returns several content blocks at once.
   */
  resolveContentBlocks = unary<contentContentBlockQueryServiceApi.ResolveContentBlocksRequest, contentContentBlockQueryServiceApi.ResolveContentBlocksResponse>(
    (request) => this.workflow.resolveContentBlocks(request),
  );

  /**
   * Summarizes a content block.
   */
  summarizeContentBlocks = (call: ServerUnaryCall<contentContentBlockQueryServiceApi.SummarizeContentBlocksRequest, contentContentBlockQueryServiceApi.SummarizeContentBlocksResponse>, done: sendUnaryData<contentContentBlockQueryServiceApi.SummarizeContentBlocksResponse>): void => {
    void this.workflow.summarizeContentBlocks(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ContentBlockQueryHandler): contentContentBlockQueryServiceApi.ContentBlockQueryServiceServer {
  return {
    browseContentBlocks: handler.browseContentBlocks,
    countContentBlocks: handler.countContentBlocks,
    exportContentBlocks: handler.exportContentBlocks,
    lookupContentBlock: handler.lookupContentBlock,
    peekContentBlock: handler.peekContentBlock,
    resolveContentBlocks: handler.resolveContentBlocks,
    summarizeContentBlocks: handler.summarizeContentBlocks,
  };
}
