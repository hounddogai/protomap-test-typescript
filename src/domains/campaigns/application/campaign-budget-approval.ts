/**
 * Routes campaign budgets through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as campaignsCampaignAssetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as campaignsCampaignBudgetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_budget_approval_service.js";
import * as campaignsMarketingCampaignApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_approval_service.js";
import * as campaignsMarketingCampaignQueryServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as catalogProductServiceApi from "../../../../.cache/proto/acme/catalog/v1/product_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersCustomerServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as documentsDocumentValidationServiceApi from "../../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as mediaRenditionReportingServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as procurementPurchaseRequisitionQueryServiceApi from "../../../../.cache/proto/acme/procurement/v1/purchase_requisition_query_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { requireReply, serviceError } from "../../../platform/errors.js";
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
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toCampaignBudgetRecord } from "../data/records.js";
import { CampaignsRepository } from "../data/repository.js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate campaign budget operations and persist audit data.
 */
@injectable()
export class CampaignBudgetApprovalWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.CampaignAssetApprovalService") private readonly campaignsCampaignAssetApprovalClient: campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignApprovalService") private readonly campaignsMarketingCampaignApprovalClient: campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignQueryService") private readonly campaignsMarketingCampaignQueryClient: campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignService") private readonly campaignsMarketingCampaignClient: campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient,
    @inject("grpc:acme.catalog.v1.ProductService") private readonly catalogProductClient: catalogProductServiceApi.ProductServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerService") private readonly customersCustomerClient: customersCustomerServiceApi.CustomerServiceClient,
    @inject("grpc:acme.documents.v1.DocumentValidationService") private readonly documentsDocumentValidationClient: documentsDocumentValidationServiceApi.DocumentValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.media.v1.RenditionReportingService") private readonly mediaRenditionReportingClient: mediaRenditionReportingServiceApi.RenditionReportingServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.procurement.v1.PurchaseRequisitionQueryService") private readonly procurementPurchaseRequisitionQueryClient: procurementPurchaseRequisitionQueryServiceApi.PurchaseRequisitionQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a campaign budget.
   */
  async approveCampaignBudget(req: campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetRequest): Promise<campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "ApproveCampaignBudget", req);
    this.logger.info("approve_campaign_budget", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationServiceApi.ListNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignBudget?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
        ownerId: (req?.campaignBudget?.campaignBudgetId ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationServiceApi.ListNotificationsRequest, notificationsNotificationServiceApi.ListNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.listNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsNotificationServiceApi.ListNotificationsRequest, notificationsNotificationServiceApi.ListNotificationsResponse>(invoke1, request1));
    const request2 = campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest.fromPartial({
      campaignAsset: { audit: { etag: (req?.campaignBudget?.audit?.etag ?? "") } },
      context: req?.context,
      details: { approver: { email: (req?.campaignBudget?.holder?.email ?? "") } },
    });
    const invoke2: Unary<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse> =
      (input, done) => this.campaignsCampaignAssetApprovalClient.commentCampaignAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ApproveCampaignBudget.CommentCampaignAssetApproval", () => call<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse>(invoke2, request2));
    const request3 = mediaRenditionReportingServiceApi.ScheduleRenditionReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke3: Unary<mediaRenditionReportingServiceApi.ScheduleRenditionReportRequest, mediaRenditionReportingServiceApi.ScheduleRenditionReportResponse> =
      (input, done) => this.mediaRenditionReportingClient.scheduleRenditionReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignRequest.fromPartial({
      context: req?.context,
      marketingCampaign: {
        participants: [{
          contact: {
            email: (req?.campaignBudget?.contact?.email ?? ""),
            phone: (req?.campaignBudget?.contact?.phone ?? ""),
            preferredChannel: (req?.campaignBudget?.contact?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const reply4 = await this.workQueue.enqueue<campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignRequest, campaignsMarketingCampaignApprovalServiceApi.SubmitMarketingCampaignResponse>(
      "acme.campaigns.v1.CampaignBudgetApprovalService/ApproveCampaignBudget:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetResponse.fromPartial({
        outcome: { status: (reply2?.outcome?.status ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetResponse.fromPartial({
        outcome: { message: (reply4?.outcome?.message ?? "") },
        result: { status: (reply4?.result?.status ?? "") },
      }),
      campaignsCampaignBudgetApprovalServiceApi.ApproveCampaignBudgetResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          holder: req?.campaignBudget?.holder,
        },
      }),
    );
  }

  /**
   * Comments a campaign budget.
   */
  async commentCampaignBudgetApproval(req: campaignsCampaignBudgetApprovalServiceApi.CommentCampaignBudgetApprovalRequest): Promise<campaignsCampaignBudgetApprovalServiceApi.CommentCampaignBudgetApprovalResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "CommentCampaignBudgetApproval", req);
    this.logger.info("comment_campaign_budget_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionReportingServiceApi.GenerateRenditionReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke1: Unary<mediaRenditionReportingServiceApi.GenerateRenditionReportRequest, mediaRenditionReportingServiceApi.GenerateRenditionReportResponse> =
      (input, done) => this.mediaRenditionReportingClient.generateRenditionReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<mediaRenditionReportingServiceApi.GenerateRenditionReportRequest, mediaRenditionReportingServiceApi.GenerateRenditionReportResponse>(invoke1, request1));
    const settled2 = await Promise.allSettled((req?.campaignBudget?.limits ?? []).map(async (item) => {
      const request2 = customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromPartial({
        context: req?.context,
        customerSegment: {
          action: { $case: "discount", discount: { amount: item?.amount } },
          name: (item?.name ?? ""),
        },
      });
      const invoke2: Unary<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse> =
        (input, done) => this.customersCustomerSegmentValidationClient.lintCustomerSegments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetApprovalServiceApi.CommentCampaignBudgetApprovalResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      campaignsCampaignBudgetApprovalServiceApi.CommentCampaignBudgetApprovalResponse.fromPartial({
        campaignBudget: { campaignBudgetId: (req?.campaignBudgetId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Delegates a campaign budget.
   */
  async delegateCampaignBudgetApproval(req: campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalRequest): Promise<campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "DelegateCampaignBudgetApproval", req);
    this.logger.info("delegate_campaign_budget_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = procurementPurchaseRequisitionQueryServiceApi.ExportPurchaseRequisitionsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
      },
    });
    const stream1 = this.procurementPurchaseRequisitionQueryClient.exportPurchaseRequisitions(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? procurementPurchaseRequisitionQueryServiceApi.ExportPurchaseRequisitionsResponse.fromPartial({});
    const request2 = catalogProductServiceApi.CreateProductRequest.fromPartial({
      context: req?.context,
      product: {
        audit: { createdBy: (req?.campaignBudget?.audit?.createdBy ?? "") },
        owner: { userId: (req?.details?.approver?.userId ?? "") },
      },
    });
    const invoke2: Unary<catalogProductServiceApi.CreateProductRequest, catalogProductServiceApi.CreateProductResponse> =
      (input, done) => this.catalogProductClient.createProduct(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<catalogProductServiceApi.CreateProductResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalResponse.fromPartial({
        campaignBudget: { holder: { displayName: (reply2?.product?.owner?.displayName ?? "") } },
      }),
      campaignsCampaignBudgetApprovalServiceApi.DelegateCampaignBudgetApprovalResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          status: req?.campaignBudget?.status,
        },
      }),
    );
  }

  /**
   * Recalls a campaign budget.
   */
  async recallCampaignBudget(req: campaignsCampaignBudgetApprovalServiceApi.RecallCampaignBudgetRequest): Promise<campaignsCampaignBudgetApprovalServiceApi.RecallCampaignBudgetResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "RecallCampaignBudget", req);
    this.logger.info("recall_campaign_budget", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.campaignBudget?.openedAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
      },
    });
    const invoke1: Unary<campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.ListMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.listMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: {
          createdAt: req?.campaignBudget?.audit?.createdAt,
          updatedAt: req?.campaignBudget?.audit?.updatedAt,
          updatedBy: (req?.campaignBudget?.audit?.updatedBy ?? ""),
        },
        owner: { userId: (req?.details?.approver?.userId ?? "") },
      },
    });
    const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityRequest, featureflagsFeatureFlagValidationServiceApi.CheckFeatureFlagEligibilityResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.checkFeatureFlagEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetApprovalServiceApi.RecallCampaignBudgetResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      campaignsCampaignBudgetApprovalServiceApi.RecallCampaignBudgetResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      campaignsCampaignBudgetApprovalServiceApi.RecallCampaignBudgetResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          openedAt: req?.campaignBudget?.openedAt,
        },
      }),
    );
  }

  /**
   * Rejects a campaign budget.
   */
  async rejectCampaignBudget(req: campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetRequest): Promise<campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "RejectCampaignBudget", req);
    this.logger.info("reject_campaign_budget", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.campaignBudget?.holder?.displayName ?? ""),
          email: (req?.campaignBudget?.holder?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
    });
    const method1 = "delegateCampaignAssetApproval" as const;
    const invoke1: Unary<campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse> =
      (input, done) => this.campaignsCampaignAssetApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.DelegateCampaignAssetApprovalResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<documentsDocumentValidationServiceApi.PreviewDocumentResponse>> = [];
    for (const item of (req?.campaignBudget?.limits ?? [])) {
      tasks2.push(async () => {
        const request2 = documentsDocumentValidationServiceApi.PreviewDocumentRequest.fromPartial({
          context: req?.context,
          details: { contact: { phone: (req?.campaignBudget?.contact?.phone ?? "") } },
          document: {
            audit: { updatedAt: req?.campaignBudget?.audit?.updatedAt },
            settlement: { $case: "bank", bank: {
              iban: ((req?.campaignBudget?.funding?.$case === "bank" ? req?.campaignBudget?.funding.bank : undefined)?.iban ?? ""),
            } },
            lines: [{ tax: { amount: item?.amount } }],
          },
        });
        const invoke2: Unary<documentsDocumentValidationServiceApi.PreviewDocumentRequest, documentsDocumentValidationServiceApi.PreviewDocumentResponse> =
          (input, done) => this.documentsDocumentValidationClient.previewDocument(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<documentsDocumentValidationServiceApi.PreviewDocumentRequest, documentsDocumentValidationServiceApi.PreviewDocumentResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? documentsDocumentValidationServiceApi.PreviewDocumentResponse.fromPartial({});
    const results3 = await Promise.all((req?.campaignBudget?.limits ?? []).map(async (item) => {
      const request3 = notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsRequest.fromPartial({
        context: req?.context,
        subscription: { action: { $case: "discount", discount: { amount: item?.amount } } },
      });
      const invoke3: Unary<notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsResponse> =
        (input, done) => this.notificationsSubscriptionSyncClient.reconcileSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? notificationsSubscriptionSyncServiceApi.ReconcileSubscriptionsResponse.fromPartial({});
    const request4 = customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest.fromPartial({
      consentRecord: {
        measurements: [{ unit: (reply1?.campaignAsset?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const proxy4 = forwarding(this.customersConsentRecordValidationClient);
    const invoke4: Unary<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse> =
      (input, done) => proxy4.previewConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse.fromPartial({
        campaignBudget: { campaignBudgetId: (req?.campaignBudgetId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Submits a campaign budget.
   */
  async submitCampaignBudget(req: campaignsCampaignBudgetApprovalServiceApi.SubmitCampaignBudgetRequest): Promise<campaignsCampaignBudgetApprovalServiceApi.SubmitCampaignBudgetResponse> {
    validateContext(req.context);
    if (req.campaignBudget) {
      await this.repository.save(toCampaignBudgetRecord(req.context.tenantId, req.campaignBudget));
    }
    await this.repository.record(req.context.tenantId, "SubmitCampaignBudget", req);
    this.logger.info("submit_campaign_budget", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
      },
    });
    const invoke1: Unary<campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignQueryClient.countMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.CountMarketingCampaignsResponse>(invoke1, request1);
    const request2 = customersCustomerServiceApi.SearchCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.campaignBudget?.labels ?? {}))),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<customersCustomerServiceApi.SearchCustomersRequest, customersCustomerServiceApi.SearchCustomersResponse> =
      (input, done) => this.customersCustomerClient.searchCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersCustomerServiceApi.SearchCustomersRequest, customersCustomerServiceApi.SearchCustomersResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsCampaignBudgetApprovalServiceApi.SubmitCampaignBudgetResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      campaignsCampaignBudgetApprovalServiceApi.SubmitCampaignBudgetResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      campaignsCampaignBudgetApprovalServiceApi.SubmitCampaignBudgetResponse.fromPartial({
        campaignBudget: {
          campaignBudgetId: (req?.campaignBudgetId ?? ""),
          status: req?.campaignBudget?.status,
        },
      }),
    );
  }
}
