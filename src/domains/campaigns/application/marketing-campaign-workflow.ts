/**
 * Runs the long-lived workflow that takes a marketing campaign from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as campaignsCampaignAssetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_asset_approval_service.js";
import * as campaignsCampaignAssetQueryServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_asset_query_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as campaignsMarketingCampaignWorkflowServiceApi from "../../../../.cache/proto/acme/campaigns/v1/marketing_campaign_workflow_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toMarketingCampaignRecord } from "../data/records.js";
import { CampaignsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate marketing campaign operations and persist audit data.
 */
@injectable()
export class MarketingCampaignWorkflowWorkflow {
  constructor(
    @inject(CampaignsRepository) private readonly repository: CampaignsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.campaigns.v1.CampaignAssetApprovalService") private readonly campaignsCampaignAssetApprovalClient: campaignsCampaignAssetApprovalServiceApi.CampaignAssetApprovalServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignAssetQueryService") private readonly campaignsCampaignAssetQueryClient: campaignsCampaignAssetQueryServiceApi.CampaignAssetQueryServiceClient,
    @inject("grpc:acme.campaigns.v1.MarketingCampaignService") private readonly campaignsMarketingCampaignClient: campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentWorkflowService") private readonly experimentsExperimentWorkflowClient: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateHistoryService") private readonly notificationsNotificationTemplateHistoryClient: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a marketing campaign.
   */
  async advanceMarketingCampaignWorkflow(req: campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowRequest): Promise<campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "AdvanceMarketingCampaignWorkflow", req);
    this.logger.info("advance_marketing_campaign_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.marketingCampaign?.location?.lines ?? []).map((value) => value),
        },
      },
      ledgerAccount: { audit: { createdAt: req?.marketingCampaign?.audit?.createdAt } },
    });
    const proxy1 = forwarding(this.ledgerLedgerAccountValidationClient);
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse> =
      (input, done) => proxy1.scoreLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse>(invoke1, request1);
    const request2 = campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.marketingCampaign?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.ledgerAccount?.labels ?? {}))),
        region: (req?.marketingCampaign?.location?.region ?? ""),
      },
    });
    const invoke2: Unary<campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse> =
      (input, done) => this.campaignsCampaignAssetQueryClient.browseCampaignAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      campaignsMarketingCampaignWorkflowServiceApi.AdvanceMarketingCampaignWorkflowResponse.fromPartial({
        marketingCampaign: {
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
          organizer: req?.marketingCampaign?.organizer,
        },
      }),
    );
  }

  /**
   * Cancels a marketing campaign.
   */
  async cancelMarketingCampaignWorkflow(req: campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowRequest): Promise<campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "CancelMarketingCampaignWorkflow", req);
    this.logger.info("cancel_marketing_campaign_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.notify?.email ?? ""),
        preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.campaignsMarketingCampaignClient.watchMarketingCampaigns(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? campaignsMarketingCampaignServiceApi.WatchMarketingCampaignsResponse.fromPartial({});
    const request2 = campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest.fromPartial({
      campaignAsset: {
        locator: { $case: "address", address: {
          countryCode: (req?.marketingCampaign?.location?.countryCode ?? ""),
          region: (req?.marketingCampaign?.location?.region ?? ""),
        } },
        audit: { updatedBy: (req?.marketingCampaign?.audit?.updatedBy ?? "") },
      },
      context: req?.context,
      details: {
        approver: { userId: (req?.marketingCampaign?.organizer?.userId ?? "") },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse> =
      (input, done) => this.campaignsCampaignAssetApprovalClient.commentCampaignAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      campaignsMarketingCampaignWorkflowServiceApi.CancelMarketingCampaignWorkflowResponse.fromPartial({
        marketingCampaign: {
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
          title: (req?.marketingCampaign?.title ?? ""),
        },
      }),
    );
  }

  /**
   * Lists marketing campaigns a page at a time.
   */
  async listMarketingCampaignWorkflows(req: campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsRequest): Promise<campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListMarketingCampaignWorkflows", req);
    this.logger.info("list_marketing_campaign_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.context?.baggage ?? {}))),
      context: input1?.context,
      details: {
        recipient: { email: (input1?.context?.actor?.email ?? "") },
        variables: Object.fromEntries(Object.entries((input1?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient.shareDeliveryAttemptExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return campaignsMarketingCampaignWorkflowServiceApi.ListMarketingCampaignWorkflowsResponse.fromPartial({
      marketingCampaigns: [{
        organizer: { displayName: (reply1?.deliveryAttempt?.subject?.displayName ?? "") },
      }],
    });
  }

  /**
   * Pauses a marketing campaign.
   */
  async pauseMarketingCampaignWorkflow(req: campaignsMarketingCampaignWorkflowServiceApi.PauseMarketingCampaignWorkflowRequest): Promise<campaignsMarketingCampaignWorkflowServiceApi.PauseMarketingCampaignWorkflowResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "PauseMarketingCampaignWorkflow", req);
    this.logger.info("pause_marketing_campaign_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.marketingCampaign?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.marketingCampaign?.metadata ?? {}))),
        ownerId: (req?.marketingCampaign?.organizer?.userId ?? ""),
        region: (req?.marketingCampaign?.location?.region ?? ""),
      },
    });
    const cloned1: campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.ListMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.listMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.ListMarketingCampaignsResponse>(invoke1, cloned1);
    const request2 = campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.marketingCampaign?.location?.region ?? "") },
    });
    const decoded2 = campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest.fromJSON(
      JSON.parse(JSON.stringify(campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest.toJSON(request2))),
    );
    const invoke2: Unary<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.searchMarketingCampaigns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignWorkflowServiceApi.PauseMarketingCampaignWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      campaignsMarketingCampaignWorkflowServiceApi.PauseMarketingCampaignWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      campaignsMarketingCampaignWorkflowServiceApi.PauseMarketingCampaignWorkflowResponse.fromPartial({
        marketingCampaign: {
          location: req?.marketingCampaign?.location,
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a marketing campaign.
   */
  async resumeMarketingCampaignWorkflow(req: campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowRequest): Promise<campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "ResumeMarketingCampaignWorkflow", req);
    this.logger.info("resume_marketing_campaign_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: { updatedBy: (req?.marketingCampaign?.audit?.updatedBy ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.AnnotateNotificationTemplateVersionRequest",
      value: Buffer.from(notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionRequest.encode(request1).finish()),
    });
    const unpacked1 = notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionRequest.decode(envelope1.value);
    const invoke1: Unary<notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionRequest, notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionResponse> =
      (input, done) => this.notificationsNotificationTemplateHistoryClient.annotateNotificationTemplateVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionRequest, notificationsNotificationTemplateHistoryServiceApi.AnnotateNotificationTemplateVersionResponse>(invoke1, unpacked1);
    const request2 = experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: {
          createdBy: (req?.marketingCampaign?.audit?.createdBy ?? ""),
          updatedBy: (req?.marketingCampaign?.audit?.updatedBy ?? ""),
        },
      },
    });
    const client2 = this.clients.get<experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient>("acme.experiments.v1.ExperimentWorkflowService");
    const invoke2: Unary<experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse> =
      (input, done) => client2.advanceExperimentWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.AdvanceExperimentWorkflowResponse>(invoke2, request2);
    const request3 = campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignRequest.fromPartial({
      context: req?.context,
      etag: (req?.marketingCampaign?.audit?.etag ?? ""),
      marketingCampaignId: (req?.marketingCampaignId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const invoke3: Unary<campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.deleteMarketingCampaign(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.DeleteMarketingCampaignResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse.fromPartial({
        marketingCampaign: {
          location: {
            countryCode: (reply1?.notificationTemplate?.billingAddress?.countryCode ?? ""),
          },
        },
      }),
      campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse.fromPartial({
        marketingCampaign: {
          location: { recipient: (reply2?.experiment?.location?.recipient ?? "") },
        },
      }),
      campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      campaignsMarketingCampaignWorkflowServiceApi.ResumeMarketingCampaignWorkflowResponse.fromPartial({
        marketingCampaign: {
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
          title: (req?.marketingCampaign?.title ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a marketing campaign.
   */
  async signalMarketingCampaignWorkflow(req: campaignsMarketingCampaignWorkflowServiceApi.SignalMarketingCampaignWorkflowRequest): Promise<campaignsMarketingCampaignWorkflowServiceApi.SignalMarketingCampaignWorkflowResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "SignalMarketingCampaignWorkflow", req);
    this.logger.info("signal_marketing_campaign_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest.fromPartial({
      context: req?.context,
      marketingCampaign: {
        participants: [{ contact: { email: (req?.details?.notify?.email ?? "") } }],
      },
    });
    const invoke1: Unary<campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse> =
      (input, done) => this.campaignsMarketingCampaignClient.createMarketingCampaign(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<campaignsMarketingCampaignServiceApi.CreateMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.CreateMarketingCampaignResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignWorkflowServiceApi.SignalMarketingCampaignWorkflowResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      campaignsMarketingCampaignWorkflowServiceApi.SignalMarketingCampaignWorkflowResponse.fromPartial({
        marketingCampaign: {
          location: req?.marketingCampaign?.location,
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a marketing campaign.
   */
  async startMarketingCampaignWorkflow(req: campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowRequest): Promise<campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse> {
    validateContext(req.context);
    if (req.marketingCampaign) {
      await this.repository.save(toMarketingCampaignRecord(req.context.tenantId, req.marketingCampaign));
    }
    await this.repository.record(req.context.tenantId, "StartMarketingCampaignWorkflow", req);
    this.logger.info("start_marketing_campaign_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest.fromPartial({
      campaignAsset: { audit: { updatedAt: req?.marketingCampaign?.audit?.updatedAt } },
      context: req?.context,
      details: { approver: { email: (req?.details?.notify?.email ?? "") } },
    });
    const invoke1: Unary<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse> =
      (input, done) => this.campaignsCampaignAssetApprovalClient.commentCampaignAssetApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("StartMarketingCampaignWorkflow.CommentCampaignAssetApproval", () => call<campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalRequest, campaignsCampaignAssetApprovalServiceApi.CommentCampaignAssetApprovalResponse>(invoke1, request1));
    const request2 = notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        measurements: [{ unit: (reply1?.campaignAsset?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.marketingCampaign?.organizer?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.PullDeliveryAttemptsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.pullDeliveryAttempts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetRequest.fromPartial({
      campaignAsset: {
        audit: { createdBy: (req?.marketingCampaign?.audit?.createdBy ?? "") },
      },
      context: req?.context,
    });
    const reply3 = await this.workQueue.enqueue<campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetRequest, campaignsCampaignAssetApprovalServiceApi.ApproveCampaignAssetResponse>(
      "acme.campaigns.v1.MarketingCampaignWorkflowService/StartMarketingCampaignWorkflow:2", request3,
    );
    let selected4_1: string | undefined;
    switch (reply3?.campaignAsset?.locator?.$case) {
      case "address":
        selected4_1 = ((reply3?.campaignAsset?.locator?.$case === "address" ? reply3?.campaignAsset?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.campaignAsset?.audit?.updatedAt,
        ownerId: (req?.marketingCampaign?.organizer?.userId ?? ""),
        region: (selected4_1 ?? ""),
      },
    });
    const invoke4: Unary<campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse> =
      (input, done) => this.campaignsCampaignAssetQueryClient.browseCampaignAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsRequest, campaignsCampaignAssetQueryServiceApi.BrowseCampaignAssetsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      campaignsMarketingCampaignWorkflowServiceApi.StartMarketingCampaignWorkflowResponse.fromPartial({
        marketingCampaign: {
          marketingCampaignId: (req?.marketingCampaignId ?? ""),
          status: req?.marketingCampaign?.status,
        },
      }),
    );
  }
}
