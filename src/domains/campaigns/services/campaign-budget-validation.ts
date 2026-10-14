/**
 * Checks campaign budgets against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as campaignsCampaignBudgetValidationServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as contentArticleQueryServiceApi from "../../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as deliveriesDeliveryServiceApi from "../../../../.cache/proto/acme/deliveries/v1/delivery_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as ticketingTicketServiceApi from "../../../../.cache/proto/acme/ticketing/v1/ticket_service.js";
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
import { collect, upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toCampaignBudgetRecord } from "../data/records.js";
import { CampaignsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate campaign budget operations and persist audit data.
 */
@injectable()
export class CampaignBudgetValidationWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.content.v1.ArticleQueryService") private readonly contentArticleQueryClient: contentArticleQueryServiceApi.ArticleQueryServiceClient,
    @inject("grpc:acme.deliveries.v1.DeliveryService") private readonly deliveriesDeliveryClient: deliveriesDeliveryServiceApi.DeliveryServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetValidationService") private readonly mediaMediaAssetValidationClient: mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.ticketing.v1.TicketService") private readonly ticketingTicketClient: ticketingTicketServiceApi.TicketServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a campaign budget.
   */
  async checkCampaignBudgetEligibility(req: campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest): Promise<campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "CheckCampaignBudgetEligibility", req);
    this.logger.info("check_campaign_budget_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = contentArticleQueryServiceApi.SummarizeArticlesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.annotations ?? {}))),
      context: input1?.context,
    });
    const invoke1: Unary<contentArticleQueryServiceApi.SummarizeArticlesRequest, contentArticleQueryServiceApi.SummarizeArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.summarizeArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentArticleQueryServiceApi.SummarizeArticlesRequest, contentArticleQueryServiceApi.SummarizeArticlesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          status: req?.campaignBudget?.status,
        },
      }),
    );
  }

  /**
   * Explains a campaign budget.
   */
  async explainCampaignBudgetDecision(req: campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest): Promise<campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "ExplainCampaignBudgetDecision", req);
    this.logger.info("explain_campaign_budget_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.campaignBudget?.limits ?? []).map(async (item) => {
      const request1 = communityPostValidationServiceApi.ScorePostRequest.fromPartial({
        context: req?.context,
        post: {
          settlement: { $case: "card", card: {
            token: ((req?.campaignBudget?.funding?.$case === "card" ? req?.campaignBudget?.funding.card : undefined)?.token ?? ""),
          } },
          counterparty: { email: (req?.campaignBudget?.contact?.email ?? "") },
          lines: [{ tax: { amount: item?.amount } }],
        },
      });
      const invoke1: Unary<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse> =
        (input, done) => this.communityPostValidationClient.scorePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: communityPostValidationServiceApi.ScorePostResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? communityPostValidationServiceApi.ScorePostResponse.fromPartial({});
    const request2 = notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest.fromPartial({
      context: req?.context,
      details: { recipient: { phone: (req?.campaignBudget?.contact?.phone ?? "") } },
    });
    const cloned2: notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest, notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.notifyDeliveryAttemptWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersRequest, notificationsDeliveryAttemptNotificationServiceApi.NotifyDeliveryAttemptWatchersResponse>(invoke2, cloned2);
    const request3 = notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        audit: {
          createdAt: reply1?.post?.audit?.createdAt,
          updatedBy: (reply1?.post?.audit?.updatedBy ?? ""),
        },
        origin: { $case: "customer", customer: { number: (reply2?.deliveryAttempt?.subject?.number ?? "") } },
      },
    });
    const decoded3 = notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.toJSON(request3))),
    );
    const invoke3: Unary<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.annotateNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse.fromPartial({
        campaignBudget: { audit: { updatedBy: (reply3?.notification?.audit?.updatedBy ?? "") } },
        result: { message: (reply3?.outcome?.message ?? "") },
      }),
      campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          labels: (req?.campaignBudget?.labels ?? {}),
        },
      }),
    );
  }

  /**
   * Returns a campaign budget.
   */
  async getCampaignBudgetRules(req: campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesRequest): Promise<campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesResponse> {
    validateContext(req.context);
    if (!req.campaignBudgetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "campaign_budget_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetCampaignBudgetRules", req);
    this.logger.info("get_campaign_budget_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormValidationServiceApi.ScoreFormRequest.fromPartial({
      context: req?.context,
      form: {
        audit: { createdAt: req?.context?.deadline },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        }],
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.ScoreFormRequest",
      value: Buffer.from(formsFormValidationServiceApi.ScoreFormRequest.encode(request1).finish()),
    });
    const unpacked1 = formsFormValidationServiceApi.ScoreFormRequest.decode(envelope1.value);
    const invoke1: Unary<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse> =
      (input, done) => this.formsFormValidationClient.scoreForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse>(invoke1, unpacked1);
    const request2 = notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.form?.billingAddress?.region ?? "") },
    });
    const client2 = this.clients.get<notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient>("acme.notifications.v1.NotificationHistoryService");
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse> =
      (input, done) => client2.listNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse>(invoke2, request2);
    return mergeResponses(
      campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesResponse.fromPartial({ campaignBudget: { campaignBudgetId: (req?.campaignBudgetId ?? "") } }),
    );
  }

  /**
   * Lints a campaign budget.
   */
  async lintCampaignBudgets(req: campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsRequest): Promise<campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "LintCampaignBudgets", req);
    this.logger.info("lint_campaign_budgets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ticketingTicketServiceApi.BatchCreateTicketsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "record", record: {
        audit: { createdBy: (req?.campaignBudget?.audit?.createdBy ?? "") },
        settlement: { $case: "card", card: {
          holderName: ((req?.campaignBudget?.funding?.$case === "card" ? req?.campaignBudget?.funding.card : undefined)?.holderName ?? ""),
          network: ((req?.campaignBudget?.funding?.$case === "card" ? req?.campaignBudget?.funding.card : undefined)?.network ?? ""),
          token: ((req?.campaignBudget?.funding?.$case === "card" ? req?.campaignBudget?.funding.card : undefined)?.token ?? ""),
        } },
      } },
    });
    const reply1 = await upload<ticketingTicketServiceApi.BatchCreateTicketsRequest, ticketingTicketServiceApi.BatchCreateTicketsResponse>(
      (done) => this.ticketingTicketClient.batchCreateTickets(metadataFor(request1.context), { deadline: Date.now() + 15_000 }, done), [request1],
    );
    const request2 = formsFormValidationServiceApi.ScoreFormRequest.fromPartial({
      context: req?.context,
      form: {
        settlement: { $case: "card", card: {
          last4: ((req?.campaignBudget?.funding?.$case === "card" ? req?.campaignBudget?.funding.card : undefined)?.last4 ?? ""),
        } },
        counterparty: { customerId: (req?.campaignBudget?.holder?.customerId ?? "") },
      },
    });
    const invoke2: Unary<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse> =
      (input, done) => this.formsFormValidationClient.scoreForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          currencyCode: (req?.campaignBudget?.currencyCode ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a campaign budget.
   */
  async normalizeCampaignBudget(req: campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetRequest): Promise<campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "NormalizeCampaignBudget", req);
    this.logger.info("normalize_campaign_budget", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: req?.campaignBudget?.contact?.name,
          preferredChannel: (req?.campaignBudget?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest, mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetValidationClient.previewMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<mediaMediaAssetValidationServiceApi.PreviewMediaAssetRequest, mediaMediaAssetValidationServiceApi.PreviewMediaAssetResponse>(invoke1, request1));
    const request2 = notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        requester: {
          name: req?.details?.contact?.name,
          phone: (req?.campaignBudget?.contact?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.annotateNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("NormalizeCampaignBudget.AnnotateNotificationVersion", () => call<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(invoke2, request2));
    const request3 = contentArticleQueryServiceApi.SuggestArticlesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignBudget?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
        ownerId: (reply1?.result?.correlationId ?? ""),
        region: ((reply1?.mediaAsset?.locator?.$case === "address" ? reply1?.mediaAsset?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke3: Unary<contentArticleQueryServiceApi.SuggestArticlesRequest, contentArticleQueryServiceApi.SuggestArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.suggestArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse.fromPartial({
        campaignBudget: { contact: { email: (reply1?.mediaAsset?.owner?.email ?? "") } },
      }),
      campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          openedAt: req?.campaignBudget?.openedAt,
        },
      }),
    );
  }

  /**
   * Previews a campaign budget.
   */
  async previewCampaignBudget(req: campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest): Promise<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "PreviewCampaignBudget", req);
    this.logger.info("preview_campaign_budget", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<deliveriesDeliveryServiceApi.CloneDeliveryResponse>> = [];
    for (const item of (req?.campaignBudget?.limits ?? [])) {
      tasks1.push(async () => {
        const request1 = deliveriesDeliveryServiceApi.CloneDeliveryRequest.fromPartial({
          context: req?.context,
          delivery: {
            audit: { updatedBy: (req?.campaignBudget?.audit?.updatedBy ?? "") },
            settlement: { $case: "bank", bank: {
              iban: ((req?.campaignBudget?.funding?.$case === "bank" ? req?.campaignBudget?.funding.bank : undefined)?.iban ?? ""),
            } },
            counterparty: { displayName: (req?.campaignBudget?.holder?.displayName ?? "") },
            lines: [{ amount: item?.amount }],
          },
        });
        const invoke1: Unary<deliveriesDeliveryServiceApi.CloneDeliveryRequest, deliveriesDeliveryServiceApi.CloneDeliveryResponse> =
          (input, done) => this.deliveriesDeliveryClient.cloneDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<deliveriesDeliveryServiceApi.CloneDeliveryRequest, deliveriesDeliveryServiceApi.CloneDeliveryResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? deliveriesDeliveryServiceApi.CloneDeliveryResponse.fromPartial({});
    const request2 = personalizationRecommendationQueryServiceApi.ExportRecommendationsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.delivery?.billingAddress?.region ?? "") },
    });
    const stream2 = this.personalizationRecommendationQueryClient.exportRecommendations(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? personalizationRecommendationQueryServiceApi.ExportRecommendationsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse.fromPartial({
      campaignBudget: {
        balance: req?.campaignBudget?.balance,
        campaignBudgetId: (req?.campaignBudgetId ?? ""),
      },
    });
  }

  /**
   * Scores a campaign budget.
   */
  async scoreCampaignBudget(req: campaignsCampaignBudgetValidationServiceApi.ScoreCampaignBudgetRequest): Promise<campaignsCampaignBudgetValidationServiceApi.ScoreCampaignBudgetResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "ScoreCampaignBudget", req);
    this.logger.info("score_campaign_budget", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.NormalizePostRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { recipient: (req?.details?.destination?.recipient ?? "") },
        settlement: { $case: "card", card: {
          last4: ((req?.campaignBudget?.funding?.$case === "card" ? req?.campaignBudget?.funding.card : undefined)?.last4 ?? ""),
        } },
        counterparty: { email: (req?.campaignBudget?.contact?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>(
      "acme.campaigns.v1.CampaignBudgetValidationService/ScoreCampaignBudget:0", request1,
    );
    const request2 = searchSearchIndexQueryServiceApi.FindSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.post?.billingAddress?.region ?? "") },
    });
    const invoke2: Unary<searchSearchIndexQueryServiceApi.FindSearchIndexesRequest, searchSearchIndexQueryServiceApi.FindSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.findSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<searchSearchIndexQueryServiceApi.FindSearchIndexesRequest, searchSearchIndexQueryServiceApi.FindSearchIndexesResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetValidationServiceApi.ScoreCampaignBudgetResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      campaignsCampaignBudgetValidationServiceApi.ScoreCampaignBudgetResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      campaignsCampaignBudgetValidationServiceApi.ScoreCampaignBudgetResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        campaignBudget: { campaignBudgetId: (req?.campaignBudgetId ?? "") },
      }),
    );
  }

  /**
   * Validates a campaign budget.
   */
  async validateCampaignBudget(req: campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest): Promise<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "ValidateCampaignBudget", req);
    this.logger.info("validate_campaign_budget", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { email: (req?.details?.contact?.email ?? "") },
        audit: { updatedAt: req?.campaignBudget?.audit?.updatedAt },
        requester: {
          preferredChannel: (req?.campaignBudget?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest, notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.recordNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const results2 = await Promise.all((req?.campaignBudget?.limits ?? []).map(async (item) => {
      const request2 = notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest.fromPartial({
        context: req?.context,
        subscription: { name: (item?.name ?? "") },
      });
      const invoke2: Unary<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse> =
        (input, done) => this.notificationsSubscriptionApprovalClient.commentSubscriptionApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse.fromPartial({});
    const request3 = notificationsNotificationHistoryServiceApi.RevertNotificationRequest.fromPartial({
      context: req?.context,
      notification: { requester: { name: req?.details?.contact?.name } },
    });
    const invoke3: Unary<notificationsNotificationHistoryServiceApi.RevertNotificationRequest, notificationsNotificationHistoryServiceApi.RevertNotificationResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.revertNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse.fromPartial({
        campaignBudget: { contact: { email: (reply1?.notification?.assignee?.email ?? "") } },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse.fromPartial({
        campaignBudget: {
          contact: {
            phone: (reply3?.notification?.requester?.phone ?? ""),
            preferredChannel: (reply3?.notification?.requester?.preferredChannel ?? ""),
          },
        },
      }),
      campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          holder: req?.campaignBudget?.holder,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for CampaignBudgetValidationService; workflows own validation and database transactions.
 */
@injectable()
export class CampaignBudgetValidationHandler {
  constructor(@inject(CampaignBudgetValidationWorkflow) private readonly workflow: CampaignBudgetValidationWorkflow) {}

  /**
   * Checks a campaign budget.
   */
  checkCampaignBudgetEligibility = unary<campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest, campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse>(
    (request) => this.workflow.checkCampaignBudgetEligibility(request),
  );

  /**
   * Explains a campaign budget.
   */
  explainCampaignBudgetDecision = unary<campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest, campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse>(
    (request) => this.workflow.explainCampaignBudgetDecision(request),
  );

  /**
   * Returns a campaign budget.
   */
  getCampaignBudgetRules = (call: ServerUnaryCall<campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesRequest, campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesResponse>, done: sendUnaryData<campaignsCampaignBudgetValidationServiceApi.GetCampaignBudgetRulesResponse>): void => {
    void this.workflow.getCampaignBudgetRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a campaign budget.
   */
  lintCampaignBudgets = unary<campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsRequest, campaignsCampaignBudgetValidationServiceApi.LintCampaignBudgetsResponse>(
    (request) => this.workflow.lintCampaignBudgets(request),
  );

  /**
   * Normalizes a campaign budget.
   */
  normalizeCampaignBudget = unary<campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse>(
    (request) => this.workflow.normalizeCampaignBudget(request),
  );

  /**
   * Previews a campaign budget.
   */
  previewCampaignBudget = (call: ServerUnaryCall<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>, done: sendUnaryData<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>): void => {
    void this.workflow.previewCampaignBudget(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Scores a campaign budget.
   */
  scoreCampaignBudget = unary<campaignsCampaignBudgetValidationServiceApi.ScoreCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ScoreCampaignBudgetResponse>(
    (request) => this.workflow.scoreCampaignBudget(request),
  );

  /**
   * Validates a campaign budget.
   */
  validateCampaignBudget = unary<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse>(
    (request) => this.workflow.validateCampaignBudget(request),
  );
}

export function implementation(handler: CampaignBudgetValidationHandler): campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceServer {
  return {
    checkCampaignBudgetEligibility: handler.checkCampaignBudgetEligibility,
    explainCampaignBudgetDecision: handler.explainCampaignBudgetDecision,
    getCampaignBudgetRules: handler.getCampaignBudgetRules,
    lintCampaignBudgets: handler.lintCampaignBudgets,
    normalizeCampaignBudget: handler.normalizeCampaignBudget,
    previewCampaignBudget: handler.previewCampaignBudget,
    scoreCampaignBudget: handler.scoreCampaignBudget,
    validateCampaignBudget: handler.validateCampaignBudget,
  };
}
