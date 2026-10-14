/**
 * Routes marketing campaigns through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as accountingChartOfAccountsQueryServiceApi from "../../../../.cache/proto/acme/accounting/v1/chart_of_accounts_query_service.js";
import * as boxofficeBoxOfficeSaleCalculationServiceApi from "../../../../.cache/proto/acme/boxoffice/v1/box_office_sale_calculation_service.js";
import * as campaignsCampaignBudgetValidationServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_budget_validation_service.js";
import * as campaignsMarketingCampaignApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_approval_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as chatChatBotWorkflowServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_workflow_service.js";
import * as contentContentRevisionWorkflowServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_workflow_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as documentsDocumentQueryServiceApi from "../../../../.cache/proto/acme/documents/v1/document_query_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toMarketingCampaignRecord } from "../data/records.js";
import { CampaignsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate marketing campaign operations and persist audit data.
 */
@injectable()
export class MarketingCampaignApprovalWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.accounting.v1.ChartOfAccountsQueryService") private readonly accountingChartOfAccountsQueryClient: accountingChartOfAccountsQueryServiceApi.ChartOfAccountsQueryServiceClient,
    @inject("grpc:acme.boxoffice.v1.BoxOfficeSaleCalculationService") private readonly boxofficeBoxOfficeSaleCalculationClient: boxofficeBoxOfficeSaleCalculationServiceApi.BoxOfficeSaleCalculationServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignBudgetValidationService") private readonly campaignsCampaignBudgetValidationClient: campaignsCampaignBudgetValidationServiceApi.CampaignBudgetValidationServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignService") private readonly campaignsMarketingCampaignClient: campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotWorkflowService") private readonly chatChatBotWorkflowClient: chatChatBotWorkflowServiceApi.ChatBotWorkflowServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionWorkflowService") private readonly contentContentRevisionWorkflowClient: contentContentRevisionWorkflowServiceApi.ContentRevisionWorkflowServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentQueryService") private readonly documentsDocumentQueryClient: documentsDocumentQueryServiceApi.DocumentQueryServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a marketing campaign.
   */
  async approveMarketingCampaign(req: campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "ApproveMarketingCampaign", req);
    this.logger.info("approve_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: {
          etag: (req?.marketingCampaign?.audit?.etag ?? ""),
          updatedBy: (req?.marketingCampaign?.audit?.updatedBy ?? ""),
        },
        billingAddress: {
          countryCode: (req?.marketingCampaign?.location?.countryCode ?? ""),
          locality: (req?.marketingCampaign?.location?.locality ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.previewNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.PreviewNotificationTemplateResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      campaignsMarketingCampaignApprovalServiceApi.ApproveMarketingCampaignResponse.fromPartial({
        marketingCampaign: { marketingCampaignId: (req?.marketingCampaignId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Comments a marketing campaign.
   */
  async commentMarketingCampaignApproval(req: campaignsMarketingCampaignApprovalServiceApi.CommentMarketingCampaignApprovalRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.CommentMarketingCampaignApprovalResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "CommentMarketingCampaignApproval", req);
    this.logger.info("comment_marketing_campaign_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.marketingCampaign?.audit?.createdAt,
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (req?.marketingCampaign?.location?.region ?? ""),
      },
    });
    const invoke1: Unary<metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.suggestMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CommentMarketingCampaignApproval.SuggestMetricSerieses", () => call<metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.SuggestMetricSeriesesResponse>(invoke1, request1));
    const request2 = boxofficeBoxOfficeSaleCalculationServiceApi.RecalculateBoxOfficeSalesRequest.fromPartial({
      boxOfficeSale: {
        billingAddress: { locality: (req?.marketingCampaign?.location?.locality ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.marketingCampaign?.location?.countryCode ?? ""),
          lines: (req?.marketingCampaign?.location?.lines ?? []).map((value) => value),
          postalCode: (req?.marketingCampaign?.location?.postalCode ?? ""),
        },
      },
    });
    const invoke2: Unary<boxofficeBoxOfficeSaleCalculationServiceApi.RecalculateBoxOfficeSalesRequest, boxofficeBoxOfficeSaleCalculationServiceApi.RecalculateBoxOfficeSalesResponse> =
      (input, done) => this.boxofficeBoxOfficeSaleCalculationClient.recalculateBoxOfficeSales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignApprovalServiceApi.CommentMarketingCampaignApprovalResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      campaignsMarketingCampaignApprovalServiceApi.CommentMarketingCampaignApprovalResponse.fromPartial({
        marketingCampaign: {
          organizer: { displayName: (reply2?.boxOfficeSale?.counterparty?.displayName ?? "") },
        },
      }),
      campaignsMarketingCampaignApprovalServiceApi.CommentMarketingCampaignApprovalResponse.fromPartial({
        marketingCampaign: {
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
          status: req?.marketingCampaign?.status,
        },
      }),
    );
  }

  /**
   * Delegates a marketing campaign.
   */
  async delegateMarketingCampaignApproval(req: campaignsMarketingCampaignApprovalServiceApi.DelegateMarketingCampaignApprovalRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.DelegateMarketingCampaignApprovalResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "DelegateMarketingCampaignApproval", req);
    this.logger.info("delegate_marketing_campaign_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest.fromPartial({
      campaignBudget: {
        audit: {
          etag: (req?.marketingCampaign?.audit?.etag ?? ""),
          updatedAt: req?.marketingCampaign?.audit?.updatedAt,
        },
        holder: { email: (req?.details?.approver?.email ?? "") },
      },
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>(
      "acme.campaigns.v1.MarketingCampaignApprovalService/DelegateMarketingCampaignApproval:0", request1,
    );
    let selected2_2: string | undefined;
    switch (reply1?.campaignBudget?.funding?.$case) {
      case "card":
        selected2_2 = ((reply1?.campaignBudget?.funding?.$case === "card" ? reply1?.campaignBudget?.funding.card : undefined)?.holderName ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest.fromPartial({
      campaignBudget: {
        audit: { etag: (req?.marketingCampaign?.audit?.etag ?? "") },
        funding: { $case: "card", card: { holderName: (selected2_2 ?? "") } },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.approver?.email ?? ""),
          phone: (reply1?.campaignBudget?.contact?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.validateCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.ValidateCampaignBudgetResponse>(invoke2, request2);
    const request3 = customersCustomerQueryServiceApi.ExportCustomersRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.marketingCampaign?.location?.region ?? "") },
    });
    const stream3 = this.customersCustomerQueryClient.exportCustomers(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? customersCustomerQueryServiceApi.ExportCustomersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignApprovalServiceApi.DelegateMarketingCampaignApprovalResponse.fromPartial({
        outcome: {
          nextSteps: (reply1?.outcome?.nextSteps ?? []),
          referenceId: (reply1?.outcome?.referenceId ?? ""),
        },
      }),
      campaignsMarketingCampaignApprovalServiceApi.DelegateMarketingCampaignApprovalResponse.fromPartial({
        marketingCampaign: {
          audit: { createdAt: reply2?.campaignBudget?.audit?.createdAt },
          participants: [{ contact: { email: (reply2?.campaignBudget?.holder?.email ?? "") } }],
        },
      }),
      campaignsMarketingCampaignApprovalServiceApi.DelegateMarketingCampaignApprovalResponse.fromPartial({
        marketingCampaign: {
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
          status: req?.marketingCampaign?.status,
        },
      }),
    );
  }

  /**
   * Escalates a marketing campaign.
   */
  async escalateMarketingCampaign(req: campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "EscalateMarketingCampaign", req);
    this.logger.info("escalate_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.marketingCampaign?.participants ?? []).map(async (item) => {
      const request1 = campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsRequest.fromPartial({
        context: req?.context,
        subscriber: { name: item?.contact?.name },
      });
      const stream1 = this.campaignsMarketingCampaignClient.watchMarketingCampaigns(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
      const messages1 = await collect(stream1);
      const reply1 = messages1.at(-1) ?? campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse.fromPartial({});
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse.fromPartial({});
    const request2 = customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        owner: { displayName: (req?.marketingCampaign?.organizer?.displayName ?? "") },
      },
      details: {
        destination: {
          countryCode: (req?.marketingCampaign?.location?.countryCode ?? ""),
          lines: (req?.marketingCampaign?.location?.lines ?? []).map((value) => value),
          locality: (req?.marketingCampaign?.location?.locality ?? ""),
        },
      },
    });
    const invoke2: Unary<customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.simulateCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<customersCustomerSegmentCalculationServiceApi.SimulateCustomerSegmentResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: req?.details?.approver,
        requester: { email: (req?.context?.actor?.email ?? "") },
        subject: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream3 = this.mediaTranscodeJobSyncClient.streamTranscodeJobChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          audit: {
            createdAt: reply2?.customerSegment?.audit?.createdAt,
            createdBy: (reply2?.customerSegment?.audit?.createdBy ?? ""),
          },
        },
      }),
      campaignsMarketingCampaignApprovalServiceApi.EscalateMarketingCampaignResponse.fromPartial({
        marketingCampaign: { marketingCampaignId: (req?.marketingCampaignId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a marketing campaign.
   */
  async getMarketingCampaignApprovalStatus(req: campaignsMarketingCampaignApprovalServiceApi.GetMarketingCampaignApprovalStatusRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.GetMarketingCampaignApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.marketingCampaignId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "marketing_campaign_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetMarketingCampaignApprovalStatus", req);
    this.logger.info("get_marketing_campaign_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    return campaignsMarketingCampaignApprovalServiceApi.GetMarketingCampaignApprovalStatusResponse.fromPartial({
      marketingCampaign: { marketingCampaignId: (req?.marketingCampaignId ?? "") },
    });
  }

  /**
   * Lists marketing campaigns a page at a time.
   */
  async listPendingMarketingCampaigns(req: campaignsMarketingCampaignApprovalServiceApi.ListPendingMarketingCampaignsRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.ListPendingMarketingCampaignsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingMarketingCampaigns", req);
    this.logger.info("list_pending_marketing_campaigns", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest.fromPartial({
      campaignBudget: {
        audit: { createdAt: req?.filter?.createdAfter },
        contact: { email: (req?.context?.actor?.email ?? "") },
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
    });
    const invoke1: Unary<campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionRequest, campaignsCampaignBudgetValidationServiceApi.ExplainCampaignBudgetDecisionResponse> =
      (input, done) => this.campaignsCampaignBudgetValidationClient.explainCampaignBudgetDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = accountingChartOfAccountsQueryServiceApi.CountChartOfAccountsesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        ownerId: (req?.filter?.ownerId ?? ""),
      },
    });
    const invoke2: Unary<accountingChartOfAccountsQueryServiceApi.CountChartOfAccountsesRequest, accountingChartOfAccountsQueryServiceApi.CountChartOfAccountsesResponse> =
      (input, done) => this.accountingChartOfAccountsQueryClient.countChartOfAccountses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignApprovalServiceApi.ListPendingMarketingCampaignsResponse.fromPartial({
        marketingCampaigns: [{ audit: { etag: (reply1?.campaignBudget?.audit?.etag ?? "") } }],
        result: { status: (reply1?.result?.status ?? "") },
      }),
      campaignsMarketingCampaignApprovalServiceApi.ListPendingMarketingCampaignsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Recalls a marketing campaign.
   */
  async recallMarketingCampaign(req: campaignsMarketingCampaignApprovalServiceApi.RecallMarketingCampaignRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.RecallMarketingCampaignResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "RecallMarketingCampaign", req);
    this.logger.info("recall_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotWorkflowServiceApi.ListChatBotWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.marketingCampaign?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.marketingCampaign?.organizer?.userId ?? ""),
        region: (req?.marketingCampaign?.location?.region ?? ""),
      },
    });
    const method1 = "listChatBotWorkflows" as const;
    const invoke1: Unary<chatChatBotWorkflowServiceApi.ListChatBotWorkflowsRequest, chatChatBotWorkflowServiceApi.ListChatBotWorkflowsResponse> =
      (input, done) => this.chatChatBotWorkflowClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotWorkflowServiceApi.ListChatBotWorkflowsRequest, chatChatBotWorkflowServiceApi.ListChatBotWorkflowsResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.marketingCampaign?.participants ?? []).map(async (item) => {
      const request2 = documentsDocumentQueryServiceApi.CountDocumentsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: req?.marketingCampaign?.audit?.updatedAt,
          labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
          ownerId: (item?.participantId ?? ""),
          region: (req?.marketingCampaign?.location?.region ?? ""),
        },
      });
      const invoke2: Unary<documentsDocumentQueryServiceApi.CountDocumentsRequest, documentsDocumentQueryServiceApi.CountDocumentsResponse> =
        (input, done) => this.documentsDocumentQueryClient.countDocuments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<documentsDocumentQueryServiceApi.CountDocumentsRequest, documentsDocumentQueryServiceApi.CountDocumentsResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? documentsDocumentQueryServiceApi.CountDocumentsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignApprovalServiceApi.RecallMarketingCampaignResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      campaignsMarketingCampaignApprovalServiceApi.RecallMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          location: req?.marketingCampaign?.location,
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a marketing campaign.
   */
  async rejectMarketingCampaign(req: campaignsMarketingCampaignApprovalServiceApi.RejectMarketingCampaignRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.RejectMarketingCampaignResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "RejectMarketingCampaign", req);
    this.logger.info("reject_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowRequest.fromPartial({
      contentRevision: {
        subject: {
          displayName: (req?.marketingCampaign?.organizer?.displayName ?? ""),
          email: (req?.marketingCampaign?.organizer?.email ?? ""),
        },
      },
      context: req?.context,
      details: { notify: { email: (req?.details?.approver?.email ?? "") } },
    });
    const proxy1 = forwarding(this.contentContentRevisionWorkflowClient);
    const invoke1: Unary<contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowRequest, contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse> =
      (input, done) => proxy1.cancelContentRevisionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowRequest, contentContentRevisionWorkflowServiceApi.CancelContentRevisionWorkflowResponse>(invoke1, request1);
    const settled2 = await Promise.allSettled((req?.marketingCampaign?.participants ?? []).map(async (item) => {
      const request2 = campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetRequest.fromPartial({
        campaignBudget: { contact: { email: (item?.contact?.email ?? "") } },
        context: req?.context,
        details: {
          contact: {
            name: item?.contact?.name,
            phone: (item?.contact?.phone ?? ""),
            preferredChannel: (item?.contact?.preferredChannel ?? ""),
          },
        },
      });
      const invoke2: Unary<campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse> =
        (input, done) => this.campaignsCampaignBudgetValidationClient.normalizeCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? campaignsCampaignBudgetValidationServiceApi.NormalizeCampaignBudgetResponse.fromPartial({});
    const tasks3: Array<() => Promise<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>> = [];
    for (const item of (req?.marketingCampaign?.participants ?? [])) {
      tasks3.push(async () => {
        const request3 = campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest.fromPartial({
          context: req?.context,
          details: {
            contact: {
              email: (item?.contact?.email ?? ""),
              name: item?.contact?.name,
              preferredChannel: (item?.contact?.preferredChannel ?? ""),
            },
          },
        });
        const invoke3: Unary<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse> =
          (input, done) => this.campaignsCampaignBudgetValidationClient.previewCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetRequest, campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? campaignsCampaignBudgetValidationServiceApi.PreviewCampaignBudgetResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignApprovalServiceApi.RejectMarketingCampaignResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      campaignsMarketingCampaignApprovalServiceApi.RejectMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
          status: req?.marketingCampaign?.status,
        },
      }),
    );
  }

  /**
   * Submits a marketing campaign.
   */
  async submitMarketingCampaign(req: campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignRequest): Promise<campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "SubmitMarketingCampaign", req);
    this.logger.info("submit_marketing_campaign", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.SimulateCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        audit: { createdBy: (req?.marketingCampaign?.audit?.createdBy ?? "") },
        relationshipManager: {
          email: (req?.details?.approver?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      details: {
        destination: { region: (req?.marketingCampaign?.location?.region ?? "") },
      },
    });
    const invoke1: Unary<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.simulateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse>(invoke1, request1);
    const results2 = await Promise.all((req?.marketingCampaign?.participants ?? []).map(async (item) => {
      const request2 = campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest.fromPartial({
        campaignBudget: { contact: { email: (item?.contact?.email ?? "") } },
        context: req?.context,
      });
      const invoke2: Unary<campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest, campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse> =
        (input, done) => this.campaignsCampaignBudgetValidationClient.checkCampaignBudgetEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityRequest, campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? campaignsCampaignBudgetValidationServiceApi.CheckCampaignBudgetEligibilityResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          organizer: { email: (reply1?.customer?.relationshipManager?.email ?? "") },
          participants: [{ contact: { name: reply1?.customer?.name } }],
        },
      }),
      campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignResponse.fromPartial({
        marketingCampaign: {
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
          metadata: (req?.marketingCampaign?.metadata ?? {}),
        },
      }),
    );
  }
}
