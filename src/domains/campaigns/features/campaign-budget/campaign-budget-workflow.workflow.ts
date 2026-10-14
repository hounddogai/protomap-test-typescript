/**
 * Runs the long-lived workflow that takes a campaign budget from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as campaignsCampaignAssetWorkflowServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_asset_workflow_service.js";
import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as catalogProductCalculationServiceApi from "../../../../../.cache/proto/acme/catalog/v1/product_calculation_service.js";
import * as contentContentBlockApprovalServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_approval_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersCustomerServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as customersCustomerValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { GrpcAdapter, call, forwarding, metadataFor, type RequestPort, type Unary } from "../../../../platform/rpc.js";
import { collect, upload, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toCampaignBudgetRecord } from "../../data/records.js";
import { CampaignsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate campaign budget operations and persist audit data.
 */
@injectable()
export class CampaignBudgetWorkflowWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.CampaignAssetWorkflowService") private readonly campaignsCampaignAssetWorkflowClient: campaignsCampaignAssetWorkflowServiceApi.CampaignAssetWorkflowServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignQueryService") private readonly campaignsMarketingCampaignQueryClient: campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignService") private readonly campaignsMarketingCampaignClient: campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient,
    @inject("grpc:acme.catalog.v1.ProductCalculationService") private readonly catalogProductCalculationClient: catalogProductCalculationServiceApi.ProductCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockApprovalService") private readonly contentContentBlockApprovalClient: contentContentBlockApprovalServiceApi.ContentBlockApprovalServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.customers.v1.CustomerValidationService") private readonly customersCustomerValidationClient: customersCustomerValidationServiceApi.CustomerValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a campaign budget.
   */
  async advanceCampaignBudgetWorkflow(req: campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowRequest): Promise<campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "AdvanceCampaignBudgetWorkflow", req);
    this.logger.info("advance_campaign_budget_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.campaignBudget?.contact?.email ?? ""),
          name: req?.details?.notify?.name,
          preferredChannel: (req?.campaignBudget?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.previewConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const settled2 = await Promise.allSettled((req?.campaignBudget?.limits ?? []).map(async (item) => {
      const request2 = customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest.fromPartial({
        context: req?.context,
        customerSegment: {
          action: { $case: "discount", discount: { amount: item?.amount } },
          name: (item?.name ?? ""),
        },
      });
      const invoke2: Unary<customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest, customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse> =
        (input, done) => this.customersCustomerSegmentCalculationClient.compareCustomerSegmentOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest, customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse.fromPartial({});
    const request3 = customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            manager: {
              email: (req?.campaignBudget?.holder?.email ?? ""),
              userId: (reply2?.customerSegment?.owner?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const method3 = "explainHouseholdCalculation" as const;
    const invoke3: Unary<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse> =
      (input, done) => this.customersHouseholdCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationRequest, customersHouseholdCalculationServiceApi.ExplainHouseholdCalculationResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowResponse.fromPartial({
        campaignBudget: { holder: { email: (reply3?.household?.manager?.email ?? "") } },
      }),
      campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          openedAt: req?.campaignBudget?.openedAt,
        },
      }),
    );
  }

  /**
   * Cancels a campaign budget.
   */
  async cancelCampaignBudgetWorkflow(req: campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowRequest): Promise<campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "CancelCampaignBudgetWorkflow", req);
    this.logger.info("cancel_campaign_budget_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignBudget?.openedAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
      },
    });
    const proxy1 = forwarding(this.campaignsMarketingCampaignQueryClient);
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse> =
      (input, done) => proxy1.suggestMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse>(invoke1, request1);
    const request2 = notificationsNotificationQueryServiceApi.CountNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignBudget?.openedAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
        ownerId: (req?.campaignBudget?.campaignBudgetId ?? ""),
      },
    });
    const invoke2: Unary<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.countNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse>(invoke2, request2);
    const request3 = campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.campaignBudget?.campaignBudgetId ?? ""),
        submittedBy: req?.campaignBudget?.contact,
      } },
    });
    const reply3 = await upload<campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.BatchCreateMarketingCampaignsResponse>(
      (done) => this.campaignsMarketingCampaignClient.batchCreateMarketingCampaigns(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    const request4 = personalizationRecommendationSyncServiceApi.StreamRecommendationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        counterparty: {
          displayName: (req?.campaignBudget?.holder?.displayName ?? ""),
          email: (req?.campaignBudget?.contact?.email ?? ""),
        },
        lines: [{ unitPrice: req?.campaignBudget?.available }],
      } },
      context: req?.context,
    });
    const stream4 = this.personalizationRecommendationSyncClient.streamRecommendationChanges(metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const reading4 = collect(stream4);
    const writing4 = (async () => {
      await write(stream4, request4);
      stream4.end();
    })();
    const [messages4] = await Promise.all([reading4, writing4]);
    const reply4 = messages4.at(-1) ?? personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          contact: req?.campaignBudget?.contact,
        },
      }),
    );
  }

  /**
   * Returns a campaign budget.
   */
  async inspectCampaignBudgetWorkflow(req: campaignsCampaignBudgetWorkflowServiceApi.InspectCampaignBudgetWorkflowRequest): Promise<campaignsCampaignBudgetWorkflowServiceApi.InspectCampaignBudgetWorkflowResponse> {
    validateContext(req.context);
    if (!req.campaignBudgetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "campaign_budget_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectCampaignBudgetWorkflow", req);
    this.logger.info("inspect_campaign_budget_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.EstimateCustomerRequest.fromPartial({
      context: req?.context,
      customer: { relationshipManager: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.estimateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse>(invoke1, spread1);
    return mergeResponses(
      campaignsCampaignBudgetWorkflowServiceApi.InspectCampaignBudgetWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      campaignsCampaignBudgetWorkflowServiceApi.InspectCampaignBudgetWorkflowResponse.fromPartial({ campaignBudget: { campaignBudgetId: (req?.campaignBudgetId ?? "") } }),
    );
  }

  /**
   * Lists campaign budgets a page at a time.
   */
  async listCampaignBudgetWorkflows(req: campaignsCampaignBudgetWorkflowServiceApi.ListCampaignBudgetWorkflowsRequest): Promise<campaignsCampaignBudgetWorkflowServiceApi.ListCampaignBudgetWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListCampaignBudgetWorkflows", req);
    this.logger.info("list_campaign_budget_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return campaignsCampaignBudgetWorkflowServiceApi.ListCampaignBudgetWorkflowsResponse.fromPartial({});
  }

  /**
   * Pauses a campaign budget.
   */
  async pauseCampaignBudgetWorkflow(req: campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowRequest): Promise<campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "PauseCampaignBudgetWorkflow", req);
    this.logger.info("pause_campaign_budget_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = customersCustomerValidationServiceApi.LintCustomersRequest.fromPartial({
      context: input1?.context,
      customer: {
        contact: {
          email: (input1?.details?.notify?.email ?? ""),
          phone: (input1?.campaignBudget?.contact?.phone ?? ""),
        },
      },
      details: {
        contact: {
          phone: (input1?.details?.notify?.phone ?? ""),
          preferredChannel: (input1?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse> =
      (input, done) => this.customersCustomerValidationClient.lintCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerValidationServiceApi.LintCustomersRequest, customersCustomerValidationServiceApi.LintCustomersResponse>(invoke1, request1);
    const request2 = contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { updatedAt: reply1?.customer?.audit?.updatedAt },
            location: {
              lines: (reply1?.customer?.primaryAddress?.lines ?? []).map((value) => value),
            },
            manager: {
              displayName: (reply1?.customer?.relationshipManager?.displayName ?? ""),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const cloned2: contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalRequest, contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse> =
      (input, done) => this.contentContentBlockApprovalClient.delegateContentBlockApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalRequest, contentContentBlockApprovalServiceApi.DelegateContentBlockApprovalResponse>(invoke2, cloned2);
    const tasks3: Array<() => Promise<campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse>> = [];
    for (const item of (req?.campaignBudget?.limits ?? [])) {
      tasks3.push(async () => {
        const request3 = campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowRequest.fromPartial({
          campaignAsset: {
            locator: { $case: "address", address: {
              lines: (reply1?.customer?.primaryAddress?.lines ?? []).map((value) => value),
            } },
            audit: { etag: (reply2?.contentBlock?.audit?.etag ?? "") },
            name: (item?.name ?? ""),
          },
          context: req?.context,
          details: { notify: { phone: (reply1?.customer?.contact?.phone ?? "") } },
        });
        const invoke3: Unary<campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse> =
          (input, done) => this.campaignsCampaignAssetWorkflowClient.cancelCampaignAssetWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply3 = await call<campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowRequest, campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse>(invoke3, request3);
        return reply3;
      });
    }
    const results3 = await Promise.all(tasks3.map((task) => task()));
    const reply3 = results3.at(-1) ?? campaignsCampaignAssetWorkflowServiceApi.CancelCampaignAssetWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      campaignsCampaignBudgetWorkflowServiceApi.PauseCampaignBudgetWorkflowResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          status: req?.campaignBudget?.status,
        },
      }),
    );
  }

  /**
   * Retrys a campaign budget.
   */
  async retryCampaignBudgetWorkflow(req: campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowRequest): Promise<campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "RetryCampaignBudgetWorkflow", req);
    this.logger.info("retry_campaign_budget_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerServiceApi.ListCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignBudget?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
        ownerId: (req?.campaignBudget?.holder?.customerId ?? ""),
      },
    });
    const decoded1 = customersCustomerServiceApi.ListCustomersRequest.fromJSON(
      JSON.parse(JSON.stringify(customersCustomerServiceApi.ListCustomersRequest.toJSON(request1))),
    );
    const invoke1: Unary<customersCustomerServiceApi.ListCustomersRequest, customersCustomerServiceApi.ListCustomersResponse> =
      (input, done) => this.customersCustomerClient.listCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerServiceApi.ListCustomersRequest, customersCustomerServiceApi.ListCustomersResponse>(invoke1, decoded1);
    const request2 = catalogProductCalculationServiceApi.CompareProductOptionsRequest.fromPartial({
      context: req?.context,
      product: {
        audit: {
          createdAt: req?.campaignBudget?.audit?.createdAt,
          createdBy: (req?.campaignBudget?.audit?.createdBy ?? ""),
          etag: (req?.campaignBudget?.audit?.etag ?? ""),
        },
        owner: { email: (req?.campaignBudget?.contact?.email ?? "") },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.catalog.v1.CompareProductOptionsRequest",
      value: Buffer.from(catalogProductCalculationServiceApi.CompareProductOptionsRequest.encode(request2).finish()),
    });
    const unpacked2 = catalogProductCalculationServiceApi.CompareProductOptionsRequest.decode(envelope2.value);
    const invoke2: Unary<catalogProductCalculationServiceApi.CompareProductOptionsRequest, catalogProductCalculationServiceApi.CompareProductOptionsResponse> =
      (input, done) => this.catalogProductCalculationClient.compareProductOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<catalogProductCalculationServiceApi.CompareProductOptionsRequest, catalogProductCalculationServiceApi.CompareProductOptionsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowResponse.fromPartial({
        outcome: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowResponse.fromPartial({
        campaignBudget: { audit: { createdAt: reply2?.product?.audit?.createdAt } },
      }),
      campaignsCampaignBudgetWorkflowServiceApi.RetryCampaignBudgetWorkflowResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          holder: req?.campaignBudget?.holder,
        },
      }),
    );
  }

  /**
   * Starts a campaign budget.
   */
  async startCampaignBudgetWorkflow(req: campaignsCampaignBudgetWorkflowServiceApi.StartCampaignBudgetWorkflowRequest): Promise<campaignsCampaignBudgetWorkflowServiceApi.StartCampaignBudgetWorkflowResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "StartCampaignBudgetWorkflow", req);
    this.logger.info("start_campaign_budget_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_3: string | undefined;
    switch (req?.campaignBudget?.funding?.$case) {
      case "externalAccountId":
        selected1_3 = ((req?.campaignBudget?.funding?.$case === "externalAccountId" ? req?.campaignBudget?.funding.externalAccountId : undefined) ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignBudget?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
        ownerId: (selected1_3 ?? ""),
      },
    });
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.browseMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.BrowseMarketingCampaignsResponse>(invoke1, request1);
    const request2 = customersCustomerQueryServiceApi.CountCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignBudget?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
        ownerId: (req?.campaignBudget?.holder?.customerId ?? ""),
      },
    });
    const invoke2: Unary<customersCustomerQueryServiceApi.CountCustomersRequest, customersCustomerQueryServiceApi.CountCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.countCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<customersCustomerQueryServiceApi.CountCustomersRequest, customersCustomerQueryServiceApi.CountCustomersResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetWorkflowServiceApi.StartCampaignBudgetWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      campaignsCampaignBudgetWorkflowServiceApi.StartCampaignBudgetWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      campaignsCampaignBudgetWorkflowServiceApi.StartCampaignBudgetWorkflowResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          labels: (req?.campaignBudget?.labels ?? {}),
        },
      }),
    );
  }
}
