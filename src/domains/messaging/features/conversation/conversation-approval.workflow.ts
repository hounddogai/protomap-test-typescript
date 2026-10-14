/**
 * Routes conversations through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import * as contractsContractQueryServiceApi from "../../../../../.cache/proto/acme/contracts/v1/contract_query_service.js";
import * as experimentsExposureImportServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as featurestoreFeatureViewServiceApi from "../../../../../.cache/proto/acme/featurestore/v1/feature_view_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChannelReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import * as messagingChannelSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationApprovalServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_approval_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as procurementPurchaseRequisitionCalculationServiceApi from "../../../../../.cache/proto/acme/procurement/v1/purchase_requisition_calculation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toConversationRecord } from "../../data/records.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate conversation operations and persist audit data.
 */
@injectable()
export class ConversationApprovalWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceApprovalService") private readonly audiencesAudienceApprovalClient: audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignBudgetWorkflowService") private readonly campaignsCampaignBudgetWorkflowClient: campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient,
    @inject("grpc:acme.contracts.v1.ContractQueryService") private readonly contractsContractQueryClient: contractsContractQueryServiceApi.ContractQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewService") private readonly featurestoreFeatureViewClient: featurestoreFeatureViewServiceApi.FeatureViewServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelReportingService") private readonly messagingChannelReportingClient: messagingChannelReportingServiceApi.ChannelReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelSyncService") private readonly messagingChannelSyncClient: messagingChannelSyncServiceApi.ChannelSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.procurement.v1.PurchaseRequisitionCalculationService") private readonly procurementPurchaseRequisitionCalculationClient: procurementPurchaseRequisitionCalculationServiceApi.PurchaseRequisitionCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a conversation.
   */
  async approveConversation(req: messagingConversationApprovalServiceApi.ApproveConversationRequest): Promise<messagingConversationApprovalServiceApi.ApproveConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "ApproveConversation", req);
    this.logger.info("approve_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.PushChatMessageRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.channelId ?? ""),
          code: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.code ?? ""),
        },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse> =
      (input, done) => this.messagingChatMessageSyncClient.pushChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = featurestoreFeatureViewServiceApi.ListFeatureViewsRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: input2?.conversation?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (input2?.conversation?.assignee?.userId ?? ""),
      },
    });
    const invoke2: Unary<featurestoreFeatureViewServiceApi.ListFeatureViewsRequest, featurestoreFeatureViewServiceApi.ListFeatureViewsResponse> =
      (input, done) => this.featurestoreFeatureViewClient.listFeatureViews(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<featurestoreFeatureViewServiceApi.ListFeatureViewsRequest, featurestoreFeatureViewServiceApi.ListFeatureViewsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationApprovalServiceApi.ApproveConversationResponse.fromPartial({ outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") } }),
      messagingConversationApprovalServiceApi.ApproveConversationResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      messagingConversationApprovalServiceApi.ApproveConversationResponse.fromPartial({
        conversation: {
          assignee: req?.conversation?.assignee,
          conversationId: (req?.conversationId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a conversation.
   */
  async commentConversationApproval(req: messagingConversationApprovalServiceApi.CommentConversationApprovalRequest): Promise<messagingConversationApprovalServiceApi.CommentConversationApprovalResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "CommentConversationApproval", req);
    this.logger.info("comment_conversation_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelSyncServiceApi.ListChannelConflictsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.conversation?.audit?.updatedAt },
    });
    const cloned1: messagingChannelSyncServiceApi.ListChannelConflictsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<messagingChannelSyncServiceApi.ListChannelConflictsRequest, messagingChannelSyncServiceApi.ListChannelConflictsResponse> =
      (input, done) => this.messagingChannelSyncClient.listChannelConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChannelSyncServiceApi.ListChannelConflictsRequest, messagingChannelSyncServiceApi.ListChannelConflictsResponse>(invoke1, cloned1);
    const request2 = campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowRequest.fromPartial({
      campaignBudget: { audit: { createdAt: req?.conversation?.audit?.createdAt } },
      context: req?.context,
      details: {
        notify: {
          email: (req?.conversation?.assignee?.email ?? ""),
          name: req?.conversation?.requester?.name,
        },
      },
    });
    const decoded2 = campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowRequest.toJSON(request2))),
    );
    const invoke2: Unary<campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowResponse> =
      (input, done) => this.campaignsCampaignBudgetWorkflowClient.cancelCampaignBudgetWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.CancelCampaignBudgetWorkflowResponse>(invoke2, decoded2);
    const request3 = mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest.fromPartial({
      context: req?.context,
      transcodeJob: {
        origin: { $case: "customer", customer: { displayName: (req?.details?.approver?.displayName ?? "") } },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.media.v1.ReconcileTranscodeJobsRequest",
      value: Buffer.from(mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest.encode(request3).finish()),
    });
    const unpacked3 = mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest.decode(envelope3.value);
    const invoke3: Unary<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse> =
      (input, done) => this.mediaTranscodeJobSyncClient.reconcileTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsRequest, mediaTranscodeJobSyncServiceApi.ReconcileTranscodeJobsResponse>(invoke3, unpacked3);
    const settled4 = await Promise.allSettled((req?.conversation?.comments ?? []).map(async (item) => {
      const request4 = messagingChannelCalculationServiceApi.CalculateChannelRequest.fromPartial({
        channel: {
          audit: {
            createdAt: item?.createdAt,
            updatedBy: (reply3?.transcodeJob?.audit?.updatedBy ?? ""),
          },
          owner: {
            displayName: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.displayName ?? ""),
            email: (item?.authorEmail ?? ""),
          },
        },
        context: req?.context,
      });
      const invoke4: Unary<messagingChannelCalculationServiceApi.CalculateChannelRequest, messagingChannelCalculationServiceApi.CalculateChannelResponse> =
        (input, done) => this.messagingChannelCalculationClient.calculateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply4 = await call<messagingChannelCalculationServiceApi.CalculateChannelRequest, messagingChannelCalculationServiceApi.CalculateChannelResponse>(invoke4, request4);
      return reply4;
    }));
    const results4: messagingChannelCalculationServiceApi.CalculateChannelResponse[] = [];
    for (const result of settled4) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results4.push(result.value);
    }
    const reply4 = results4.at(-1) ?? messagingChannelCalculationServiceApi.CalculateChannelResponse.fromPartial({});
    const request5 = experimentsExposureImportServiceApi.ImportExposuresRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.conversation?.requester,
      } },
    });
    const reply5 = await upload<experimentsExposureImportServiceApi.ImportExposuresRequest, experimentsExposureImportServiceApi.ImportExposuresResponse>(
      (done) => this.experimentsExposureImportClient.importExposures(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationApprovalServiceApi.CommentConversationApprovalResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      messagingConversationApprovalServiceApi.CommentConversationApprovalResponse.fromPartial({
        conversation: {
          assignee: { displayName: (reply2?.campaignBudget?.holder?.displayName ?? "") },
          requester: { email: (reply2?.campaignBudget?.contact?.email ?? "") },
        },
      }),
      messagingConversationApprovalServiceApi.CommentConversationApprovalResponse.fromPartial({
        conversation: {
          assignee: reply3?.transcodeJob?.assignee,
          subject: (reply3?.transcodeJob?.subject ?? ""),
        },
      }),
      messagingConversationApprovalServiceApi.CommentConversationApprovalResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          customFields: (req?.conversation?.customFields ?? {}),
        },
      }),
    );
  }

  /**
   * Delegates a conversation.
   */
  async delegateConversationApproval(req: messagingConversationApprovalServiceApi.DelegateConversationApprovalRequest): Promise<messagingConversationApprovalServiceApi.DelegateConversationApprovalResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "DelegateConversationApproval", req);
    this.logger.info("delegate_conversation_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceApprovalServiceApi.CommentAudienceApprovalRequest.fromPartial({
      audience: {
        audit: {
          etag: (req?.conversation?.audit?.etag ?? ""),
          updatedBy: (req?.conversation?.audit?.updatedBy ?? ""),
        },
        owner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const client1 = this.clients.get<audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient>("acme.audiences.v1.AudienceApprovalService");
    const invoke1: Unary<audiencesAudienceApprovalServiceApi.CommentAudienceApprovalRequest, audiencesAudienceApprovalServiceApi.CommentAudienceApprovalResponse> =
      (input, done) => client1.commentAudienceApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceApprovalServiceApi.CommentAudienceApprovalRequest, audiencesAudienceApprovalServiceApi.CommentAudienceApprovalResponse>(invoke1, request1);
    const request2 = messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.channelId ?? ""),
          code: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.code ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.reconcileChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationApprovalServiceApi.DelegateConversationApprovalResponse.fromPartial({
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingConversationApprovalServiceApi.DelegateConversationApprovalResponse.fromPartial({
        conversation: {
          assignee: { displayName: (reply2?.chatMessage?.subject?.displayName ?? "") },
        },
      }),
      messagingConversationApprovalServiceApi.DelegateConversationApprovalResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          requester: req?.conversation?.requester,
        },
      }),
    );
  }

  /**
   * Escalates a conversation.
   */
  async escalateConversation(req: messagingConversationApprovalServiceApi.EscalateConversationRequest): Promise<messagingConversationApprovalServiceApi.EscalateConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "EscalateConversation", req);
    this.logger.info("escalate_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelCalculationServiceApi.CompareChannelOptionsRequest.fromPartial({
      channel: {
        audit: {
          etag: (req?.conversation?.audit?.etag ?? ""),
          updatedAt: req?.conversation?.audit?.updatedAt,
        },
        owner: { email: (req?.details?.approver?.email ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelCalculationServiceApi.CompareChannelOptionsRequest, messagingChannelCalculationServiceApi.CompareChannelOptionsResponse> =
      (input, done) => this.messagingChannelCalculationClient.compareChannelOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<messagingChannelCalculationServiceApi.CompareChannelOptionsRequest, messagingChannelCalculationServiceApi.CompareChannelOptionsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationApprovalServiceApi.EscalateConversationResponse.fromPartial({
        conversation: {
          audit: { etag: (reply1?.channel?.audit?.etag ?? "") },
          requester: { email: (reply1?.channel?.owner?.email ?? "") },
        },
      }),
      messagingConversationApprovalServiceApi.EscalateConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          priority: (req?.conversation?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Returns a conversation.
   */
  async getConversationApprovalStatus(req: messagingConversationApprovalServiceApi.GetConversationApprovalStatusRequest): Promise<messagingConversationApprovalServiceApi.GetConversationApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetConversationApprovalStatus", req);
    this.logger.info("get_conversation_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelReportingServiceApi.ListChannelReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.context?.tenantId ?? ""),
      },
    });
    const invoke1: Unary<messagingChannelReportingServiceApi.ListChannelReportsRequest, messagingChannelReportingServiceApi.ListChannelReportsResponse> =
      (input, done) => this.messagingChannelReportingClient.listChannelReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetConversationApprovalStatus.ListChannelReports", () => call<messagingChannelReportingServiceApi.ListChannelReportsRequest, messagingChannelReportingServiceApi.ListChannelReportsResponse>(invoke1, request1));
    return mergeResponses(
      messagingConversationApprovalServiceApi.GetConversationApprovalStatusResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingConversationApprovalServiceApi.GetConversationApprovalStatusResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } }),
    );
  }

  /**
   * Lists conversations a page at a time.
   */
  async listPendingConversations(req: messagingConversationApprovalServiceApi.ListPendingConversationsRequest): Promise<messagingConversationApprovalServiceApi.ListPendingConversationsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingConversations", req);
    this.logger.info("list_pending_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsRequest, notificationsNotificationTemplateExportServiceApi.ListNotificationTemplateExportsResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.listNotificationTemplateExports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingConversationApprovalServiceApi.ListPendingConversationsResponse.fromPartial({
      result: {
        message: (reply1?.result?.message ?? ""),
        referenceIds: (reply1?.result?.referenceIds ?? []),
      },
    });
  }

  /**
   * Recalls a conversation.
   */
  async recallConversation(req: messagingConversationApprovalServiceApi.RecallConversationRequest): Promise<messagingConversationApprovalServiceApi.RecallConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "RecallConversation", req);
    this.logger.info("recall_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsResponse>> = [];
    for (const item of (req?.conversation?.history ?? [])) {
      tasks1.push(async () => {
        const request1 = procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsRequest.fromPartial({
          context: req?.context,
          purchaseRequisition: {
            audit: {
              createdAt: item?.changedAt,
              createdBy: (req?.conversation?.audit?.createdBy ?? ""),
              updatedBy: (req?.conversation?.audit?.updatedBy ?? ""),
            },
            counterparty: { displayName: (req?.details?.approver?.displayName ?? "") },
          },
        });
        const invoke1: Unary<procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsRequest, procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsResponse> =
          (input, done) => this.procurementPurchaseRequisitionCalculationClient.recalculatePurchaseRequisitions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsRequest, procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? procurementPurchaseRequisitionCalculationServiceApi.RecalculatePurchaseRequisitionsResponse.fromPartial({});
    const request2 = messagingChannelSyncServiceApi.ReconcileChannelsRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: {
          lines: (reply1?.purchaseRequisition?.billingAddress?.lines ?? []).map((value) => value),
        } },
        audit: { updatedBy: (reply1?.purchaseRequisition?.audit?.updatedBy ?? "") },
        owner: {
          displayName: (reply1?.purchaseRequisition?.counterparty?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const reply2 = await this.workQueue.enqueue<messagingChannelSyncServiceApi.ReconcileChannelsRequest, messagingChannelSyncServiceApi.ReconcileChannelsResponse>(
      "acme.messaging.v1.ConversationApprovalService/RecallConversation:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationApprovalServiceApi.RecallConversationResponse.fromPartial({
        conversation: {
          assignee: { displayName: (reply2?.channel?.owner?.displayName ?? "") },
        },
      }),
      messagingConversationApprovalServiceApi.RecallConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          priority: (req?.conversation?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Submits a conversation.
   */
  async submitConversation(req: messagingConversationApprovalServiceApi.SubmitConversationRequest): Promise<messagingConversationApprovalServiceApi.SubmitConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "SubmitConversation", req);
    this.logger.info("submit_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.conversation?.history ?? []).map(async (item) => {
      const request1 = contractsContractQueryServiceApi.SuggestContractsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.changedAt,
          labels: Object.fromEntries(Object.entries((req?.conversation?.customFields ?? {}))),
          ownerId: (req?.details?.approver?.userId ?? ""),
        },
      });
      const invoke1: Unary<contractsContractQueryServiceApi.SuggestContractsRequest, contractsContractQueryServiceApi.SuggestContractsResponse> =
        (input, done) => this.contractsContractQueryClient.suggestContracts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<contractsContractQueryServiceApi.SuggestContractsRequest, contractsContractQueryServiceApi.SuggestContractsResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? contractsContractQueryServiceApi.SuggestContractsResponse.fromPartial({});
    const request2 = notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.conversation?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.lintNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesRequest, notificationsNotificationTemplateValidationServiceApi.LintNotificationTemplatesResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationApprovalServiceApi.SubmitConversationResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      messagingConversationApprovalServiceApi.SubmitConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          status: req?.conversation?.status,
        },
      }),
    );
  }
}
