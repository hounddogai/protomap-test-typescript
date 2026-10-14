/**
 * Checks content blocks against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as broadcastsBroadcastQueryServiceApi from "../../../../.cache/proto/acme/broadcasts/v1/broadcast_query_service.js";
import * as contentArticleValidationServiceApi from "../../../../.cache/proto/acme/content/v1/article_validation_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as contentContentBlockValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
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
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toContentBlockRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content block operations and persist audit data.
 */
@injectable()
export class ContentBlockValidationWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.broadcasts.v1.BroadcastQueryService") private readonly broadcastsBroadcastQueryClient: broadcastsBroadcastQueryServiceApi.BroadcastQueryServiceClient,
    @inject("grpc:acme.content.v1.ArticleValidationService") private readonly contentArticleValidationClient: contentArticleValidationServiceApi.ArticleValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateNotificationService") private readonly notificationsNotificationTemplateNotificationClient: notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.sponsorships.v1.SponsorCalculationService") private readonly sponsorshipsSponsorCalculationClient: sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Explains a content block.
   */
  async explainContentBlockDecision(req: contentContentBlockValidationServiceApi.ExplainContentBlockDecisionRequest): Promise<contentContentBlockValidationServiceApi.ExplainContentBlockDecisionResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "ExplainContentBlockDecision", req);
    this.logger.info("explain_content_block_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleValidationServiceApi.ValidateArticleRequest.fromPartial({
      article: {
        audit: { createdAt: req?.contentBlock?.audit?.createdAt },
        billingAddress: {
          postalCode: (req?.contentBlock?.location?.postalCode ?? ""),
          recipient: (req?.contentBlock?.location?.recipient ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<contentArticleValidationServiceApi.ValidateArticleRequest, contentArticleValidationServiceApi.ValidateArticleResponse> =
      (input, done) => this.contentArticleValidationClient.validateArticle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleValidationServiceApi.ValidateArticleRequest, contentArticleValidationServiceApi.ValidateArticleResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesRequest.fromPartial({ context: req?.context });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.resolveNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.ResolveNotificationTemplatesResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockValidationServiceApi.ExplainContentBlockDecisionResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      contentContentBlockValidationServiceApi.ExplainContentBlockDecisionResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      contentContentBlockValidationServiceApi.ExplainContentBlockDecisionResponse.fromPartial({
        contentBlock: {
          attributes: (req?.contentBlock?.attributes ?? {}),
          contentBlockId: (req?.contentBlockId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a content block.
   */
  async getContentBlockRules(req: contentContentBlockValidationServiceApi.GetContentBlockRulesRequest): Promise<contentContentBlockValidationServiceApi.GetContentBlockRulesResponse> {
    validateContext(req.context);
    if (!req.contentBlockId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "content_block_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetContentBlockRules", req);
    this.logger.info("get_content_block_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest.fromPartial({
      contentBlock: {
        children: [{ children: [{ contentBlockId: (input1?.contentBlockId ?? "") }] }],
      },
      context: input1?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse> =
      (input, done) => this.contentContentBlockCalculationClient.compareContentBlockOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentBlockCalculationServiceApi.CompareContentBlockOptionsRequest, contentContentBlockCalculationServiceApi.CompareContentBlockOptionsResponse>(invoke1, request1);
    return mergeResponses(
      contentContentBlockValidationServiceApi.GetContentBlockRulesResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{ path: (reply1?.contentBlock?.path ?? []) }],
            location: { region: (reply1?.contentBlock?.location?.region ?? "") },
          }],
        },
      }),
      contentContentBlockValidationServiceApi.GetContentBlockRulesResponse.fromPartial({ contentBlock: { contentBlockId: (req?.contentBlockId ?? "") } }),
    );
  }

  /**
   * Lints a content block.
   */
  async lintContentBlocks(req: contentContentBlockValidationServiceApi.LintContentBlocksRequest): Promise<contentContentBlockValidationServiceApi.LintContentBlocksResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "LintContentBlocks", req);
    this.logger.info("lint_content_blocks", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.contact?.email ?? ""),
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const cloned1: notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse> =
      (input, done) => this.notificationsNotificationTemplateNotificationClient.notifyNotificationTemplateWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersRequest, notificationsNotificationTemplateNotificationServiceApi.NotifyNotificationTemplateWatchersResponse>(invoke1, cloned1);
    const request2 = broadcastsBroadcastQueryServiceApi.ExportBroadcastsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.contentBlock?.audit?.updatedAt,
        region: (req?.contentBlock?.location?.region ?? ""),
      },
    });
    const stream2 = this.broadcastsBroadcastQueryClient.exportBroadcasts(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? broadcastsBroadcastQueryServiceApi.ExportBroadcastsResponse.fromPartial({});
    const request3 = contentArticleValidationServiceApi.ExplainArticleDecisionRequest.fromPartial({
      article: {
        settlement: { $case: "card", card: {
          token: ((reply1?.notificationTemplate?.settlement?.$case === "card" ? reply1?.notificationTemplate?.settlement.card : undefined)?.token ?? ""),
        } },
      },
      context: req?.context,
    });
    const decoded3 = contentArticleValidationServiceApi.ExplainArticleDecisionRequest.fromJSON(
      JSON.parse(JSON.stringify(contentArticleValidationServiceApi.ExplainArticleDecisionRequest.toJSON(request3))),
    );
    const invoke3: Unary<contentArticleValidationServiceApi.ExplainArticleDecisionRequest, contentArticleValidationServiceApi.ExplainArticleDecisionResponse> =
      (input, done) => this.contentArticleValidationClient.explainArticleDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<contentArticleValidationServiceApi.ExplainArticleDecisionRequest, contentArticleValidationServiceApi.ExplainArticleDecisionResponse>(invoke3, decoded3);
    const request4 = contentArticleValidationServiceApi.LintArticlesRequest.fromPartial({
      article: {
        audit: { etag: (reply1?.notificationTemplate?.audit?.etag ?? "") },
        billingAddress: { recipient: (reply3?.article?.billingAddress?.recipient ?? "") },
        settlement: { $case: "card", card: {
          network: ((reply3?.article?.settlement?.$case === "card" ? reply3?.article?.settlement.card : undefined)?.network ?? ""),
        } },
      },
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.LintArticlesRequest",
      value: Buffer.from(contentArticleValidationServiceApi.LintArticlesRequest.encode(request4).finish()),
    });
    const unpacked4 = contentArticleValidationServiceApi.LintArticlesRequest.decode(envelope4.value);
    const invoke4: Unary<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse> =
      (input, done) => this.contentArticleValidationClient.lintArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockValidationServiceApi.LintContentBlocksResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{ audit: { createdAt: reply1?.notificationTemplate?.audit?.createdAt } }],
            location: {
              countryCode: (reply1?.notificationTemplate?.billingAddress?.countryCode ?? ""),
            },
          }],
        },
      }),
      contentContentBlockValidationServiceApi.LintContentBlocksResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{ audit: { updatedBy: (reply3?.article?.audit?.updatedBy ?? "") } }],
          }],
          location: { recipient: (reply3?.article?.billingAddress?.recipient ?? "") },
        },
      }),
      contentContentBlockValidationServiceApi.LintContentBlocksResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      contentContentBlockValidationServiceApi.LintContentBlocksResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          manager: req?.contentBlock?.manager,
        },
      }),
    );
  }

  /**
   * Normalizes a content block.
   */
  async normalizeContentBlock(req: contentContentBlockValidationServiceApi.NormalizeContentBlockRequest): Promise<contentContentBlockValidationServiceApi.NormalizeContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "NormalizeContentBlock", req);
    this.logger.info("normalize_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleValidationServiceApi.LintArticlesRequest.fromPartial({
      article: { audit: { etag: (req?.contentBlock?.audit?.etag ?? "") } },
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const client1 = this.clients.get<contentArticleValidationServiceApi.ArticleValidationServiceClient>("acme.content.v1.ArticleValidationService");
    const invoke1: Unary<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse> =
      (input, done) => client1.lintArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleValidationServiceApi.LintArticlesRequest, contentArticleValidationServiceApi.LintArticlesResponse>(invoke1, request1);
    const request2 = sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (reply1?.article?.billingAddress?.countryCode ?? "") },
      },
    });
    const invoke2: Unary<sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest, sponsorshipsSponsorCalculationServiceApi.SimulateSponsorResponse> =
      (input, done) => this.sponsorshipsSponsorCalculationClient.simulateSponsor(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest, sponsorshipsSponsorCalculationServiceApi.SimulateSponsorResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.article?.audit?.createdAt,
        ownerId: (reply2?.result?.correlationId ?? ""),
        region: (reply2?.sponsor?.primaryAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountQueryClient.suggestLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse>(invoke3, request3));
    const request4 = notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (reply2?.sponsor?.contact?.email ?? ""),
          preferredChannel: (reply2?.sponsor?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke4: Unary<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.pauseDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("NormalizeContentBlock.PauseDeliveryAttemptWorkflow", () => call<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockValidationServiceApi.NormalizeContentBlockResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      contentContentBlockValidationServiceApi.NormalizeContentBlockResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      contentContentBlockValidationServiceApi.NormalizeContentBlockResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      contentContentBlockValidationServiceApi.NormalizeContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{
              children: [{ attributes: (reply4?.deliveryAttempt?.attributes ?? {}) }],
            }],
          }],
        },
        result: { correlationId: (reply4?.deliveryAttempt?.correlationId ?? "") },
      }),
      contentContentBlockValidationServiceApi.NormalizeContentBlockResponse.fromPartial({
        contentBlock: {
          attributes: (req?.contentBlock?.attributes ?? {}),
          contentBlockId: (req?.contentBlockId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a content block.
   */
  async previewContentBlock(req: contentContentBlockValidationServiceApi.PreviewContentBlockRequest): Promise<contentContentBlockValidationServiceApi.PreviewContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "PreviewContentBlock", req);
    this.logger.info("preview_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.contentBlock?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.contentBlock?.attributes ?? {}))),
        ownerId: (req?.contentBlock?.contentBlockId ?? ""),
        region: (req?.contentBlock?.location?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.browseNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockValidationServiceApi.PreviewContentBlockResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      contentContentBlockValidationServiceApi.PreviewContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          manager: req?.contentBlock?.manager,
        },
      }),
    );
  }

  /**
   * Scores a content block.
   */
  async scoreContentBlock(req: contentContentBlockValidationServiceApi.ScoreContentBlockRequest): Promise<contentContentBlockValidationServiceApi.ScoreContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "ScoreContentBlock", req);
    this.logger.info("score_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.contentBlock?.manager?.email ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse>(
      "acme.content.v1.ContentBlockValidationService/ScoreContentBlock:0", request1,
    );
    const request2 = contentArticleValidationServiceApi.ValidateArticleRequest.fromPartial({
      article: {
        audit: { updatedAt: req?.contentBlock?.audit?.updatedAt },
        billingAddress: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<contentArticleValidationServiceApi.ValidateArticleRequest, contentArticleValidationServiceApi.ValidateArticleResponse> =
      (input, done) => this.contentArticleValidationClient.validateArticle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<contentArticleValidationServiceApi.ValidateArticleRequest, contentArticleValidationServiceApi.ValidateArticleResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockValidationServiceApi.ScoreContentBlockResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      contentContentBlockValidationServiceApi.ScoreContentBlockResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      contentContentBlockValidationServiceApi.ScoreContentBlockResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        contentBlock: { contentBlockId: (req?.contentBlockId ?? "") },
      }),
    );
  }

  /**
   * Validates a content block.
   */
  async validateContentBlock(req: contentContentBlockValidationServiceApi.ValidateContentBlockRequest): Promise<contentContentBlockValidationServiceApi.ValidateContentBlockResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "ValidateContentBlock", req);
    this.logger.info("validate_content_block", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleValidationServiceApi.ExplainArticleDecisionRequest.fromPartial({
      article: {
        billingAddress: {
          lines: (req?.contentBlock?.location?.lines ?? []).map((value) => value),
        },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke1: Unary<contentArticleValidationServiceApi.ExplainArticleDecisionRequest, contentArticleValidationServiceApi.ExplainArticleDecisionResponse> =
      (input, done) => this.contentArticleValidationClient.explainArticleDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<contentArticleValidationServiceApi.ExplainArticleDecisionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockValidationServiceApi.ValidateContentBlockResponse.fromPartial({
        contentBlock: {
          children: [{ children: [{ audit: { etag: (reply1?.article?.audit?.etag ?? "") } }] }],
        },
        outcome: { message: (reply1?.outcome?.message ?? "") },
      }),
      contentContentBlockValidationServiceApi.ValidateContentBlockResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          name: (req?.contentBlock?.name ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ContentBlockValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ContentBlockValidationHandler {
  constructor(@inject(ContentBlockValidationWorkflow) private readonly workflow: ContentBlockValidationWorkflow) {}

  /**
   * Explains a content block.
   */
  explainContentBlockDecision = unary<contentContentBlockValidationServiceApi.ExplainContentBlockDecisionRequest, contentContentBlockValidationServiceApi.ExplainContentBlockDecisionResponse>(
    (request) => this.workflow.explainContentBlockDecision(request),
  );

  /**
   * Returns a content block.
   */
  getContentBlockRules = unary<contentContentBlockValidationServiceApi.GetContentBlockRulesRequest, contentContentBlockValidationServiceApi.GetContentBlockRulesResponse>(
    (request) => this.workflow.getContentBlockRules(request),
  );

  /**
   * Lints a content block.
   */
  lintContentBlocks = (call: ServerUnaryCall<contentContentBlockValidationServiceApi.LintContentBlocksRequest, contentContentBlockValidationServiceApi.LintContentBlocksResponse>, done: sendUnaryData<contentContentBlockValidationServiceApi.LintContentBlocksResponse>): void => {
    void this.workflow.lintContentBlocks(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a content block.
   */
  normalizeContentBlock = unary<contentContentBlockValidationServiceApi.NormalizeContentBlockRequest, contentContentBlockValidationServiceApi.NormalizeContentBlockResponse>(
    (request) => this.workflow.normalizeContentBlock(request),
  );

  /**
   * Previews a content block.
   */
  previewContentBlock = unary<contentContentBlockValidationServiceApi.PreviewContentBlockRequest, contentContentBlockValidationServiceApi.PreviewContentBlockResponse>(
    (request) => this.workflow.previewContentBlock(request),
  );

  /**
   * Scores a content block.
   */
  scoreContentBlock = (call: ServerUnaryCall<contentContentBlockValidationServiceApi.ScoreContentBlockRequest, contentContentBlockValidationServiceApi.ScoreContentBlockResponse>, done: sendUnaryData<contentContentBlockValidationServiceApi.ScoreContentBlockResponse>): void => {
    void this.workflow.scoreContentBlock(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a content block.
   */
  validateContentBlock = unary<contentContentBlockValidationServiceApi.ValidateContentBlockRequest, contentContentBlockValidationServiceApi.ValidateContentBlockResponse>(
    (request) => this.workflow.validateContentBlock(request),
  );
}

export function implementation(handler: ContentBlockValidationHandler): contentContentBlockValidationServiceApi.ContentBlockValidationServiceServer {
  return {
    explainContentBlockDecision: handler.explainContentBlockDecision,
    getContentBlockRules: handler.getContentBlockRules,
    lintContentBlocks: handler.lintContentBlocks,
    normalizeContentBlock: handler.normalizeContentBlock,
    previewContentBlock: handler.previewContentBlock,
    scoreContentBlock: handler.scoreContentBlock,
    validateContentBlock: handler.validateContentBlock,
  };
}
