/**
 * Computes the figures of a content revision, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as authorizationAccessPolicyServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as chatChatBotQueryServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as contentArticleValidationServiceApi from "../../../../.cache/proto/acme/content/v1/article_validation_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as formsFormServiceApi from "../../../../.cache/proto/acme/forms/v1/form_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toContentRevisionRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content revision operations and persist audit data.
 */
@injectable()
export class ContentRevisionCalculationWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotQueryService") private readonly chatChatBotQueryClient: chatChatBotQueryServiceApi.ChatBotQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.content.v1.ArticleValidationService") private readonly contentArticleValidationClient: contentArticleValidationServiceApi.ArticleValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormService") private readonly formsFormClient: formsFormServiceApi.FormServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobValidationService") private readonly mediaTranscodeJobValidationClient: mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a content revision.
   */
  async calculateContentRevision(req: contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest): Promise<contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "CalculateContentRevision", req);
    this.logger.info("calculate_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleValidationServiceApi.LintArticlesRequest.fromPartial({
      article: {
        billingAddress: {
          postalCode: (req?.details?.destination?.postalCode ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
        counterparty: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const decoded1 = contentArticleValidationServiceApi.LintArticlesRequest.fromJSON(
      JSON.parse(JSON.stringify(contentArticleValidationServiceApi.LintArticlesRequest.toJSON(request1))),
    );
    const invoke1: Unary<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse> =
      (input, done) => this.contentArticleValidationClient.lintArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse>(invoke1, decoded1);
    const request2 = contentContentBlockCalculationServiceApi.QuoteContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { etag: (reply1?.article?.audit?.etag ?? "") },
            location: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
            manager: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.QuoteContentBlockRequest",
      value: Buffer.from(contentContentBlockCalculationServiceApi.QuoteContentBlockRequest.encode(request2).finish()),
    });
    const unpacked2 = contentContentBlockCalculationServiceApi.QuoteContentBlockRequest.decode(envelope2.value);
    const invoke2: Unary<contentContentBlockCalculationServiceApi.QuoteContentBlockRequest, contentContentBlockCalculationServiceApi.QuoteContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.quoteContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentBlockCalculationServiceApi.QuoteContentBlockRequest, contentContentBlockCalculationServiceApi.QuoteContentBlockResponse>(invoke2, unpacked2);
    const request3 = chatChatRoomServiceApi.BatchGetChatRoomsRequest.fromPartial({ context: req?.context });
    const client3 = this.clients.get<chatChatRoomServiceApi.ChatRoomServiceClient>("acme.chat.v1.ChatRoomService");
    const invoke3: Unary<chatChatRoomServiceApi.BatchGetChatRoomsRequest, chatChatRoomServiceApi.BatchGetChatRoomsResponse> =
      (input, done) => client3.batchGetChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomServiceApi.BatchGetChatRoomsRequest, chatChatRoomServiceApi.BatchGetChatRoomsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse.fromPartial({
        breakdown: { total: reply1?.article?.total },
        contentRevision: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          subject: req?.contentRevision?.subject,
        },
      }),
    );
  }

  /**
   * Compares a content revision.
   */
  async compareContentRevisionOptions(req: contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest): Promise<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "CompareContentRevisionOptions", req);
    this.logger.info("compare_content_revision_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            location: {
              lines: (req?.details?.destination?.lines ?? []).map((value) => value),
              locality: (req?.details?.destination?.locality ?? ""),
            },
            manager: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
          }],
          location: { recipient: (req?.details?.destination?.recipient ?? "") },
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
      (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = contentContentBlockCalculationServiceApi.RecalculateContentBlocksRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            location: { countryCode: (reply1?.contentBlock?.location?.countryCode ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<contentContentBlockCalculationServiceApi.RecalculateContentBlocksRequest, contentContentBlockCalculationServiceApi.RecalculateContentBlocksResponse> =
      (input, done) => this.contentContentBlockCalculationClient.recalculateContentBlocks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<contentContentBlockCalculationServiceApi.RecalculateContentBlocksRequest, contentContentBlockCalculationServiceApi.RecalculateContentBlocksResponse>(invoke2, request2));
    const request3 = contentArticleValidationServiceApi.ScoreArticleRequest.fromPartial({
      article: {
        audit: { etag: (reply2?.contentBlock?.audit?.etag ?? "") },
        billingAddress: {
          locality: (reply2?.contentBlock?.location?.locality ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke3: Unary<contentArticleValidationServiceApi.ScoreArticleRequest, contentArticleValidationServiceApi.ScoreArticleResponse> =
      (input, done) => this.contentArticleValidationClient.scoreArticle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("CompareContentRevisionOptions.ScoreArticle", () => call<contentArticleValidationServiceApi.ScoreArticleRequest, contentArticleValidationServiceApi.ScoreArticleResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse.fromPartial({
        contentRevision: {
          subject: { displayName: (reply1?.contentBlock?.manager?.displayName ?? "") },
        },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse.fromPartial({
        breakdown: { total: reply3?.article?.total },
        contentRevision: {
          subject: { displayName: (reply3?.article?.counterparty?.displayName ?? "") },
        },
      }),
      contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          source: (req?.contentRevision?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a content revision.
   */
  async estimateContentRevision(req: contentContentRevisionCalculationServiceApi.EstimateContentRevisionRequest): Promise<contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "EstimateContentRevision", req);
    this.logger.info("estimate_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.CalculateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            location: { postalCode: (req?.details?.destination?.postalCode ?? "") },
          }],
          location: { countryCode: (req?.details?.destination?.countryCode ?? "") },
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.CalculateContentBlockRequest, contentContentBlockCalculationServiceApi.CalculateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.calculateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = authorizationAccessPolicyServiceApi.BatchGetAccessPoliciesRequest.fromPartial({ context: req?.context });
    const reply2 = await this.workQueue.enqueue<authorizationAccessPolicyServiceApi.BatchGetAccessPoliciesRequest, authorizationAccessPolicyServiceApi.BatchGetAccessPoliciesResponse>(
      "acme.content.v1.ContentRevisionCalculationService/EstimateContentRevision:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse.fromPartial({
        contentRevision: { attributes: (reply1?.contentBlock?.attributes ?? {}) },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          subject: req?.contentRevision?.subject,
        },
      }),
    );
  }

  /**
   * Explains a content revision.
   */
  async explainContentRevisionCalculation(req: contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest): Promise<contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "ExplainContentRevisionCalculation", req);
    this.logger.info("explain_content_revision_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormServiceApi.SearchFormsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.contentRevision?.subject?.customerId ?? "") },
    });
    const invoke1: Unary<formsFormServiceApi.SearchFormsRequest, formsFormServiceApi.SearchFormsResponse> =
      (input, done) => this.formsFormClient.searchForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<formsFormServiceApi.SearchFormsRequest, formsFormServiceApi.SearchFormsResponse>(invoke1, request1));
    const results2 = await Promise.all((req?.contentRevision?.measurements ?? []).map(async (item) => {
      const request2 = contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest.fromPartial({
        contentBlock: {
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries((req?.contentRevision?.attributes ?? {}))),
              audit: { createdAt: item?.observedAt },
            }],
            manager: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
          }],
        },
        context: req?.context,
      });
      const invoke2: Unary<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse> =
        (input, done) => this.contentContentBlockCalculationClient.compareContentBlockOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          kind: (req?.contentRevision?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a content revision.
   */
  async getContentRevisionRates(req: contentContentRevisionCalculationServiceApi.GetContentRevisionRatesRequest): Promise<contentContentRevisionCalculationServiceApi.GetContentRevisionRatesResponse> {
    validateContext(req.context);
    if (!req.contentRevisionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "content_revision_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetContentRevisionRates", req);
    this.logger.info("get_content_revision_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        audit: { updatedAt: req?.context?.deadline },
      },
    });
    const invoke1: Unary<mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobRequest, mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobResponse> =
      (input, done) => this.mediaTranscodeJobValidationClient.scoreTranscodeJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<mediaTranscodeJobValidationServiceApi.ScoreTranscodeJobResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{ audit: { updatedAt: reply1?.transcodeJob?.audit?.updatedAt } }],
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
      (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    return mergeResponses(
      contentContentRevisionCalculationServiceApi.GetContentRevisionRatesResponse.fromPartial({
        contentRevision: { subject: { email: (reply1?.transcodeJob?.requester?.email ?? "") } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionCalculationServiceApi.GetContentRevisionRatesResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      contentContentRevisionCalculationServiceApi.GetContentRevisionRatesResponse.fromPartial({
        contentRevision: { contentRevisionId: (req?.contentRevisionId ?? "") },
      }),
    );
  }

  /**
   * Recalculates a content revision.
   */
  async recalculateContentRevisions(req: contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest): Promise<contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "RecalculateContentRevisions", req);
    this.logger.info("recalculate_content_revisions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.contentRevision?.measurements ?? []).map(async (item) => {
      const request1 = contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.fromPartial({
        contentBlock: {
          children: [{ children: [{ audit: { updatedAt: item?.observedAt } }] }],
        },
        context: req?.context,
      });
      const invoke1: Unary<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse> =
        (input, done) => this.contentContentBlockCalculationClient.estimateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: contentContentBlockCalculationServiceApi.EstimateContentBlockResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? contentContentBlockCalculationServiceApi.EstimateContentBlockResponse.fromPartial({});
    const results2 = await Promise.all((req?.contentRevision?.measurements ?? []).map(async (item) => {
      const request2 = chatChatBotQueryServiceApi.ExportChatBotsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
          region: (reply1?.contentBlock?.location?.region ?? ""),
        },
      });
      const stream2 = this.chatChatBotQueryClient.exportChatBots(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
      const messages2 = await collect(stream2);
      const reply2 = messages2.at(-1) ?? chatChatBotQueryServiceApi.ExportChatBotsResponse.fromPartial({});
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? chatChatBotQueryServiceApi.ExportChatBotsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse.fromPartial({
      contentRevision: {
        contentRevisionId: (req?.contentRevisionId ?? ""),
        correlationId: (req?.contentRevision?.correlationId ?? ""),
      },
    });
  }

  /**
   * Simulates a content revision.
   */
  async simulateContentRevision(req: contentContentRevisionCalculationServiceApi.SimulateContentRevisionRequest): Promise<contentContentRevisionCalculationServiceApi.SimulateContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "SimulateContentRevision", req);
    this.logger.info("simulate_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            location: {
              postalCode: (req?.details?.destination?.postalCode ?? ""),
              region: (req?.details?.destination?.region ?? ""),
            },
            manager: { email: (req?.contentRevision?.subject?.email ?? "") },
          }],
          location: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse> =
      (input, done) => this.contentContentBlockCalculationClient.compareContentBlockOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionCalculationServiceApi.SimulateContentRevisionResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      contentContentRevisionCalculationServiceApi.SimulateContentRevisionResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          source: (req?.contentRevision?.source ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ContentRevisionCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class ContentRevisionCalculationHandler {
  constructor(@inject(ContentRevisionCalculationWorkflow) private readonly workflow: ContentRevisionCalculationWorkflow) {}

  /**
   * Calculates a content revision.
   */
  calculateContentRevision = unary<contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest, contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse>(
    (request) => this.workflow.calculateContentRevision(request),
  );

  /**
   * Compares a content revision.
   */
  compareContentRevisionOptions = unary<contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsRequest, contentContentRevisionCalculationServiceApi.CompareContentRevisionOptionsResponse>(
    (request) => this.workflow.compareContentRevisionOptions(request),
  );

  /**
   * Estimates a content revision.
   */
  estimateContentRevision = (call: ServerUnaryCall<contentContentRevisionCalculationServiceApi.EstimateContentRevisionRequest, contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse>, done: sendUnaryData<contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse>): void => {
    void this.workflow.estimateContentRevision(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a content revision.
   */
  explainContentRevisionCalculation = unary<contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationRequest, contentContentRevisionCalculationServiceApi.ExplainContentRevisionCalculationResponse>(
    (request) => this.workflow.explainContentRevisionCalculation(request),
  );

  /**
   * Returns a content revision.
   */
  getContentRevisionRates = unary<contentContentRevisionCalculationServiceApi.GetContentRevisionRatesRequest, contentContentRevisionCalculationServiceApi.GetContentRevisionRatesResponse>(
    (request) => this.workflow.getContentRevisionRates(request),
  );

  /**
   * Recalculates a content revision.
   */
  recalculateContentRevisions = (call: ServerUnaryCall<contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest, contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse>, done: sendUnaryData<contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse>): void => {
    void this.workflow.recalculateContentRevisions(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Simulates a content revision.
   */
  simulateContentRevision = unary<contentContentRevisionCalculationServiceApi.SimulateContentRevisionRequest, contentContentRevisionCalculationServiceApi.SimulateContentRevisionResponse>(
    (request) => this.workflow.simulateContentRevision(request),
  );
}

export function implementation(handler: ContentRevisionCalculationHandler): contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceServer {
  return {
    calculateContentRevision: handler.calculateContentRevision,
    compareContentRevisionOptions: handler.compareContentRevisionOptions,
    estimateContentRevision: handler.estimateContentRevision,
    explainContentRevisionCalculation: handler.explainContentRevisionCalculation,
    getContentRevisionRates: handler.getContentRevisionRates,
    recalculateContentRevisions: handler.recalculateContentRevisions,
    simulateContentRevision: handler.simulateContentRevision,
  };
}
