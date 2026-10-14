/**
 * Answers read-only questions about marketing campaigns, for screens and reports. Remote work stays behind typed
 * client ports.
 */

import * as campaignsCampaignBudgetValidationServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { CampaignsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate marketing campaign operations and persist audit data.
 */
@injectable()
export class MarketingCampaignQueryWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.CampaignBudgetValidationService") private readonly campaignsCampaignBudgetValidationClient: campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyValidationService") private readonly contentTaxonomyValidationClient: contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists marketing campaigns a page at a time.
   */
  async browseMarketingCampaigns(req: campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsRequest): Promise<campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseMarketingCampaigns", req);
    this.logger.info("browse_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest.fromPartial({
      campaignBudget: {
        audit: { createdAt: req?.filter?.createdAfter },
        contact: { email: (req?.context?.actor?.email ?? "") },
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest, campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.checkCampaignBudgetEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest, campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsResponse.fromPartial({
      marketingCampaigns: [{
        audit: { createdAt: reply1?.campaignBudget?.audit?.createdAt },
        participants: [{ contact: reply1?.campaignBudget?.contact }],
      }],
    });
  }

  /**
   * Counts marketing campaigns by status.
   */
  async countMarketingCampaigns(req: campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest): Promise<campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountMarketingCampaigns", req);
    this.logger.info("count_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = identityUserValidationServiceApi.LintUsersRequest.fromPartial({
      context: input1?.context,
      user: { primaryAddress: { region: (input1?.filter?.region ?? "") } },
    });
    const invoke1: Unary<identityUserValidationServiceApi.LintUsersRequest, identityUserValidationServiceApi.LintUsersResponse> =
      (input, done) => this.identityUserValidationClient.lintUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserValidationServiceApi.LintUsersRequest, identityUserValidationServiceApi.LintUsersResponse>(invoke1, request1);
    const request2 = campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest.fromPartial({
      campaignBudget: {
        audit: { createdBy: (reply1?.user?.audit?.createdBy ?? "") },
        contact: {
          phone: (reply1?.user?.contact?.phone ?? ""),
          preferredChannel: (reply1?.user?.contact?.preferredChannel ?? ""),
        },
        holder: { email: (reply1?.user?.relationshipManager?.email ?? "") },
      },
      context: req?.context,
    });
    const cloned2: campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.validateCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
    );
  }

  /**
   * Streams every matching marketing campaign.
   */
  async exportMarketingCampaigns(req: campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsRequest): Promise<campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportMarketingCampaigns", req);
    this.logger.info("export_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        measurements: [{ observedAt: req?.filter?.createdAfter }],
        source: (req?.filter?.ownerId ?? ""),
      },
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const decoded1 = notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest, notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.checkDeliveryAttemptEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityRequest, notificationsDeliveryAttemptValidationServiceApi.CheckDeliveryAttemptEligibilityResponse>(invoke1, decoded1);
    const request2 = campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest.fromPartial({
      campaignBudget: {
        holder: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      context: req?.context,
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.campaigns.v1.ExplainCampaignBudgetDecisionRequest",
      value: Buffer.from(campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest.encode(request2).finish()),
    });
    const unpacked2 = campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest.decode(envelope2.value);
    const invoke2: Unary<campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest, campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.explainCampaignBudgetDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest, campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsResponse.fromPartial({ sequence: (reply1?.deliveryAttempt?.sequence ?? 0) }),
      campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsResponse.fromPartial({
        marketingCampaign: {
          audit: { updatedBy: (reply2?.campaignBudget?.audit?.updatedBy ?? "") },
          participants: [{ contact: reply2?.campaignBudget?.contact }],
        },
      }),
      campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsResponse.fromPartial({
        marketingCampaign: { location: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }

  /**
   * Lists marketing campaigns a page at a time.
   */
  async findMarketingCampaigns(req: campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest): Promise<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindMarketingCampaigns", req);
    this.logger.info("find_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse.fromPartial({});
  }

  /**
   * Returns a marketing campaign.
   */
  async lookupMarketingCampaign(req: campaignsMarketingCampaignQueryServiceApi.LookupMarketingCampaignRequest): Promise<campaignsMarketingCampaignQueryServiceApi.LookupMarketingCampaignResponse> {
    validateContext(req.context);
    if (!req.marketingCampaignId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "marketing_campaign_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupMarketingCampaign", req);
    this.logger.info("lookup_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const client1 = this.clients.get<campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient>("acme.campaigns.v1.CampaignBudgetValidationService");
    const invoke1: Unary<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse> =
      (input, done) => client1.validateCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse>(invoke1, request1);
    const request2 = contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            audit: { createdAt: reply1?.campaignBudget?.audit?.createdAt },
            manager: { displayName: (reply1?.campaignBudget?.holder?.displayName ?? "") },
          }],
        }],
      },
    });
    const invoke2: Unary<contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest, contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse> =
      (input, done) => this.contentTaxonomyValidationClient.checkTaxonomyEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest, contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    return mergeResponses(
      campaignsMarketingCampaignQueryServiceApi.LookupMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          participants: [{
            contact: {
              preferredChannel: (reply1?.campaignBudget?.contact?.preferredChannel ?? ""),
            },
          }],
        },
      }),
      campaignsMarketingCampaignQueryServiceApi.LookupMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          location: reply2?.taxonomy?.location,
          organizer: { displayName: (reply2?.taxonomy?.manager?.displayName ?? "") },
        },
      }),
      campaignsMarketingCampaignQueryServiceApi.LookupMarketingCampaignResponse.fromPartial({
        marketingCampaign: { marketingCampaignId: (req?.marketingCampaignId ?? "") },
      }),
    );
  }

  /**
   * Returns a marketing campaign.
   */
  async peekMarketingCampaign(req: campaignsMarketingCampaignQueryServiceApi.PeekMarketingCampaignRequest): Promise<campaignsMarketingCampaignQueryServiceApi.PeekMarketingCampaignResponse> {
    validateContext(req.context);
    if (!req.marketingCampaignId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "marketing_campaign_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekMarketingCampaign", req);
    this.logger.info("peek_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    return campaignsMarketingCampaignQueryServiceApi.PeekMarketingCampaignResponse.fromPartial({
      marketingCampaign: { marketingCampaignId: (req?.marketingCampaignId ?? "") },
    });
  }

  /**
   * Returns several marketing campaigns at once.
   */
  async resolveMarketingCampaigns(req: campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsRequest): Promise<campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveMarketingCampaigns", req);
    this.logger.info("resolve_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    return campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsResponse.fromPartial({});
  }

  /**
   * Lists marketing campaigns a page at a time.
   */
  async suggestMarketingCampaigns(req: campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest): Promise<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestMarketingCampaigns", req);
    this.logger.info("suggest_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest.fromPartial({
      campaignBudget: {
        holder: { email: (req?.context?.actor?.email ?? "") },
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      context: req?.context,
    });
    const invoke1: Unary<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.previewCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>(invoke1, request1));
    const request2 = notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: reply1?.campaignBudget?.contact?.name,
          phone: (reply1?.campaignBudget?.contact?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.previewDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("SuggestMarketingCampaigns.PreviewDeliveryAttempt", () => call<notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse.fromPartial({
        marketingCampaigns: [{ organizer: { email: (reply1?.campaignBudget?.holder?.email ?? "") } }],
        result: { status: (reply1?.result?.status ?? "") },
      }),
      campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse.fromPartial({
        result: { correlationId: (reply2?.deliveryAttempt?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Summarizes a marketing campaign.
   */
  async summarizeMarketingCampaigns(req: campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest): Promise<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeMarketingCampaigns", req);
    this.logger.info("summarize_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.SubscribeDeliveryAttemptUpdatesResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.subscribeDeliveryAttemptUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      campaignBudget: {
        holder: {
          displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? ""),
          email: (req?.context?.actor?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const reply2 = await this.workQueue.enqueue<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse>(
      "acme.campaigns.v1.MarketingCampaignQueryService/SummarizeMarketingCampaigns:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse.fromPartial({
        result: { correlationId: (reply1?.deliveryAttempt?.correlationId ?? "") },
      }),
      campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for MarketingCampaignQueryService; workflows own validation and database transactions.
 */
@injectable()
export class MarketingCampaignQueryHandler {
  constructor(@inject(MarketingCampaignQueryWorkflow) private readonly workflow: MarketingCampaignQueryWorkflow) {}

  /**
   * Lists marketing campaigns a page at a time.
   */
  browseMarketingCampaigns = unary<campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsResponse>(
    (request) => this.workflow.browseMarketingCampaigns(request),
  );

  /**
   * Counts marketing campaigns by status.
   */
  countMarketingCampaigns = unary<campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse>(
    (request) => this.workflow.countMarketingCampaigns(request),
  );

  /**
   * Streams every matching marketing campaign.
   */
  exportMarketingCampaigns = serverStream<campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.ExportMarketingCampaignsResponse>(
    (request) => this.workflow.exportMarketingCampaigns(request),
  );

  /**
   * Lists marketing campaigns a page at a time.
   */
  findMarketingCampaigns = unary<campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.FindMarketingCampaignsResponse>(
    (request) => this.workflow.findMarketingCampaigns(request),
  );

  /**
   * Returns a marketing campaign.
   */
  lookupMarketingCampaign = unary<campaignsMarketingCampaignQueryServiceApi.LookupMarketingCampaignRequest, campaignsMarketingCampaignQueryServiceApi.LookupMarketingCampaignResponse>(
    (request) => this.workflow.lookupMarketingCampaign(request),
  );

  /**
   * Returns a marketing campaign.
   */
  peekMarketingCampaign = (call: ServerUnaryCall<campaignsMarketingCampaignQueryServiceApi.PeekMarketingCampaignRequest, campaignsMarketingCampaignQueryServiceApi.PeekMarketingCampaignResponse>, done: sendUnaryData<campaignsMarketingCampaignQueryServiceApi.PeekMarketingCampaignResponse>): void => {
    void this.workflow.peekMarketingCampaign(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns several marketing campaigns at once.
   */
  resolveMarketingCampaigns = unary<campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.ResolveMarketingCampaignsResponse>(
    (request) => this.workflow.resolveMarketingCampaigns(request),
  );

  /**
   * Lists marketing campaigns a page at a time.
   */
  suggestMarketingCampaigns = unary<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse>(
    (request) => this.workflow.suggestMarketingCampaigns(request),
  );

  /**
   * Summarizes a marketing campaign.
   */
  summarizeMarketingCampaigns = (call: ServerUnaryCall<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse>, done: sendUnaryData<campaignsMarketingCampaignQueryServiceApi.SummarizeMarketingCampaignsResponse>): void => {
    void this.workflow.summarizeMarketingCampaigns(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: MarketingCampaignQueryHandler): campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceServer {
  return {
    browseMarketingCampaigns: handler.browseMarketingCampaigns,
    countMarketingCampaigns: handler.countMarketingCampaigns,
    exportMarketingCampaigns: handler.exportMarketingCampaigns,
    findMarketingCampaigns: handler.findMarketingCampaigns,
    lookupMarketingCampaign: handler.lookupMarketingCampaign,
    peekMarketingCampaign: handler.peekMarketingCampaign,
    resolveMarketingCampaigns: handler.resolveMarketingCampaigns,
    suggestMarketingCampaigns: handler.suggestMarketingCampaigns,
    summarizeMarketingCampaigns: handler.summarizeMarketingCampaigns,
  };
}
