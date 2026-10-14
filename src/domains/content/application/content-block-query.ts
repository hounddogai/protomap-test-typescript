/**
 * Answers read-only questions about content blocks, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as chatChatBotCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as contentContentBlockQueryServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as contentContentBlockValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { ContentRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content block operations and persist audit data.
 */
@injectable()
export class ContentBlockQueryWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockValidationService") private readonly contentContentBlockValidationClient: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyValidationService") private readonly contentTaxonomyValidationClient: contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists content blocks a page at a time.
   */
  async browseContentBlocks(req: contentContentBlockQueryServiceApi.BrowseContentBlocksRequest): Promise<contentContentBlockQueryServiceApi.BrowseContentBlocksResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseContentBlocks", req);
    this.logger.info("browse_content_blocks", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentContentBlockQueryServiceApi.BrowseContentBlocksResponse.fromPartial({});
  }

  /**
   * Counts content blocks by status.
   */
  async countContentBlocks(req: contentContentBlockQueryServiceApi.CountContentBlocksRequest): Promise<contentContentBlockQueryServiceApi.CountContentBlocksResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountContentBlocks", req);
    this.logger.info("count_content_blocks", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            audit: { updatedAt: req?.filter?.createdAfter },
            location: { region: (req?.filter?.region ?? "") },
          }],
        }],
      },
    });
    const invoke1: Unary<contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest, contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse> =
      (input, done) => this.contentTaxonomyValidationClient.scoreTaxonomy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest, contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentContentBlockQueryServiceApi.CountContentBlocksResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Streams every matching content block.
   */
  async exportContentBlocks(req: contentContentBlockQueryServiceApi.ExportContentBlocksRequest): Promise<contentContentBlockQueryServiceApi.ExportContentBlocksResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportContentBlocks", req);
    this.logger.info("export_content_blocks", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest.fromPartial({
      chatBot: {
        audit: { createdAt: req?.filter?.createdAfter },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<chatChatBotCalculationServiceApi.CompareChatBotOptionsRequest, chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse> =
      (input, done) => this.chatChatBotCalculationClient.compareChatBotOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<chatChatBotCalculationServiceApi.CompareChatBotOptionsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = contentContentBlockValidationServiceApi.NormalizeContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { updatedAt: reply1?.chatBot?.audit?.updatedAt },
            manager: { email: (reply1?.chatBot?.owner?.email ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<contentContentBlockValidationServiceApi.NormalizeContentBlockRequest, contentContentBlockValidationServiceApi.NormalizeContentBlockResponse> =
      (input, done) => this.contentContentBlockValidationClient.normalizeContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      contentContentBlockQueryServiceApi.ExportContentBlocksResponse.fromPartial({
        contentBlock: {
          audit: {
            createdAt: reply1?.chatBot?.audit?.createdAt,
            createdBy: (reply1?.chatBot?.audit?.createdBy ?? ""),
          },
        },
      }),
      contentContentBlockQueryServiceApi.ExportContentBlocksResponse.fromPartial({
        contentBlock: { audit: { updatedBy: (reply2?.contentBlock?.audit?.updatedBy ?? "") } },
      }),
      contentContentBlockQueryServiceApi.ExportContentBlocksResponse.fromPartial({ contentBlock: { location: { region: (req?.filter?.region ?? "") } } }),
    );
  }

  /**
   * Returns a content block.
   */
  async lookupContentBlock(req: contentContentBlockQueryServiceApi.LookupContentBlockRequest): Promise<contentContentBlockQueryServiceApi.LookupContentBlockResponse> {
    validateContext(req.context);
    if (!req.contentBlockId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "content_block_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupContentBlock", req);
    this.logger.info("lookup_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockValidationServiceApi.ScoreContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{ children: [{ contentBlockId: (req?.contentBlockId ?? "") }] }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockValidationServiceApi.ScoreContentBlockRequest, contentContentBlockValidationServiceApi.ScoreContentBlockResponse> =
      (input, done) => this.contentContentBlockValidationClient.scoreContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return mergeResponses(
      contentContentBlockQueryServiceApi.LookupContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{
              location: { postalCode: (reply1?.contentBlock?.location?.postalCode ?? "") },
            }],
          }],
        },
      }),
      contentContentBlockQueryServiceApi.LookupContentBlockResponse.fromPartial({ contentBlock: { contentBlockId: (req?.contentBlockId ?? "") } }),
    );
  }

  /**
   * Returns a content block.
   */
  async peekContentBlock(req: contentContentBlockQueryServiceApi.PeekContentBlockRequest): Promise<contentContentBlockQueryServiceApi.PeekContentBlockResponse> {
    validateContext(req.context);
    if (!req.contentBlockId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "content_block_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekContentBlock", req);
    this.logger.info("peek_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.EstimateBadgeRequest.fromPartial({
      badge: { owner: { email: (req?.context?.actor?.email ?? "") } },
      context: req?.context,
    });
    const method1 = "estimateBadge" as const;
    const invoke1: Unary<communityBadgeCalculationServiceApi.EstimateBadgeRequest, communityBadgeCalculationServiceApi.EstimateBadgeResponse> =
      (input, done) => this.communityBadgeCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeCalculationServiceApi.EstimateBadgeRequest, communityBadgeCalculationServiceApi.EstimateBadgeResponse>(invoke1, request1);
    return mergeResponses(
      contentContentBlockQueryServiceApi.PeekContentBlockResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      contentContentBlockQueryServiceApi.PeekContentBlockResponse.fromPartial({ contentBlock: { contentBlockId: (req?.contentBlockId ?? "") } }),
    );
  }

  /**
   * Returns several content blocks at once.
   */
  async resolveContentBlocks(req: contentContentBlockQueryServiceApi.ResolveContentBlocksRequest): Promise<contentContentBlockQueryServiceApi.ResolveContentBlocksResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveContentBlocks", req);
    this.logger.info("resolve_content_blocks", { tenant: req.context.tenantId, trace: req.context.traceId });
    return contentContentBlockQueryServiceApi.ResolveContentBlocksResponse.fromPartial({});
  }

  /**
   * Summarizes a content block.
   */
  async summarizeContentBlocks(req: contentContentBlockQueryServiceApi.SummarizeContentBlocksRequest): Promise<contentContentBlockQueryServiceApi.SummarizeContentBlocksResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeContentBlocks", req);
    this.logger.info("summarize_content_blocks", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotValidationServiceApi.PreviewChatBotRequest.fromPartial({
      chatBot: { action: { $case: "block", block: { reason: (req?.reason ?? "") } } },
      context: req?.context,
    });
    const proxy1 = forwarding(this.chatChatBotValidationClient);
    const invoke1: Unary<chatChatBotValidationServiceApi.PreviewChatBotRequest, chatChatBotValidationServiceApi.PreviewChatBotResponse> =
      (input, done) => proxy1.previewChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotValidationServiceApi.PreviewChatBotRequest, chatChatBotValidationServiceApi.PreviewChatBotResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      contentContentBlockQueryServiceApi.SummarizeContentBlocksResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      contentContentBlockQueryServiceApi.SummarizeContentBlocksResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
