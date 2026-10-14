/**
 * Routes participants through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as assetsFixedAssetCalculationServiceApi from "../../../../.cache/proto/acme/assets/v1/fixed_asset_calculation_service.js";
import * as campaignsCampaignBudgetApprovalServiceApi from "../../../../.cache/proto/acme/campaigns/v1/campaign_budget_approval_service.js";
import * as chatChatBotLifecycleServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as experimentsExposureApprovalServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_approval_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as formsFormWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import * as inventoryStockItemQueryServiceApi from "../../../../.cache/proto/acme/inventory/v1/stock_item_query_service.js";
import * as messagingChannelApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_approval_service.js";
import * as messagingChatMessageApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingParticipantApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_approval_service.js";
import * as messagingParticipantLifecycleServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_lifecycle_service.js";
import * as messagingParticipantReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
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
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toParticipantRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate participant operations and persist audit data.
 */
@injectable()
export class ParticipantApprovalWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.assets.v1.FixedAssetCalculationService") private readonly assetsFixedAssetCalculationClient: assetsFixedAssetCalculationServiceApi.FixedAssetCalculationServiceClient,
    @inject("grpc:acme.campaigns.v1.CampaignBudgetApprovalService") private readonly campaignsCampaignBudgetApprovalClient: campaignsCampaignBudgetApprovalServiceApi.CampaignBudgetApprovalServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotLifecycleService") private readonly chatChatBotLifecycleClient: chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureApprovalService") private readonly experimentsExposureApprovalClient: experimentsExposureApprovalServiceApi.ExposureApprovalServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormWorkflowService") private readonly formsFormWorkflowClient: formsFormWorkflowServiceApi.FormWorkflowServiceClient,
    @inject("grpc:acme.inventory.v1.StockItemQueryService") private readonly inventoryStockItemQueryClient: inventoryStockItemQueryServiceApi.StockItemQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelApprovalService") private readonly messagingChannelApprovalClient: messagingChannelApprovalServiceApi.ChannelApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageApprovalService") private readonly messagingChatMessageApprovalClient: messagingChatMessageApprovalServiceApi.ChatMessageApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageCalculationService") private readonly messagingChatMessageCalculationClient: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantLifecycleService") private readonly messagingParticipantLifecycleClient: messagingParticipantLifecycleServiceApi.ParticipantLifecycleServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantReportingService") private readonly messagingParticipantReportingClient: messagingParticipantReportingServiceApi.ParticipantReportingServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptNotificationService") private readonly notificationsDeliveryAttemptNotificationClient: notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityApprovalService") private readonly personalizationAffinityApprovalClient: personalizationAffinityApprovalServiceApi.AffinityApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a participant.
   */
  async approveParticipant(req: messagingParticipantApprovalServiceApi.ApproveParticipantRequest): Promise<messagingParticipantApprovalServiceApi.ApproveParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "ApproveParticipant", req);
    this.logger.info("approve_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = assetsFixedAssetCalculationServiceApi.QuoteFixedAssetRequest.fromPartial({
      context: input1?.context,
      details: {
        destination: { recipient: (input1?.participant?.primaryAddress?.recipient ?? "") },
      },
      fixedAsset: {
        locator: { $case: "address", address: { locality: (input1?.participant?.primaryAddress?.locality ?? "") } },
        audit: { updatedAt: input1?.participant?.audit?.updatedAt },
        owner: { email: (input1?.participant?.contact?.email ?? "") },
      },
    });
    const invoke1: Unary<assetsFixedAssetCalculationServiceApi.QuoteFixedAssetRequest, assetsFixedAssetCalculationServiceApi.QuoteFixedAssetResponse> =
      (input, done) => this.assetsFixedAssetCalculationClient.quoteFixedAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<assetsFixedAssetCalculationServiceApi.QuoteFixedAssetRequest, assetsFixedAssetCalculationServiceApi.QuoteFixedAssetResponse>(invoke1, request1);
    const request2 = featureflagsFeatureFlagQueryServiceApi.ExportFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.fixedAsset?.audit?.updatedAt,
        region: (req?.participant?.primaryAddress?.region ?? ""),
      },
    });
    const stream2 = this.featureflagsFeatureFlagQueryClient.exportFeatureFlags(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? featureflagsFeatureFlagQueryServiceApi.ExportFeatureFlagsResponse.fromPartial({});
    const request3 = messagingParticipantReportingServiceApi.FetchParticipantReportRequest.fromPartial({
      context: req?.context,
      participantId: (req?.participantId ?? ""),
    });
    const cloned3: messagingParticipantReportingServiceApi.FetchParticipantReportRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<messagingParticipantReportingServiceApi.FetchParticipantReportRequest, messagingParticipantReportingServiceApi.FetchParticipantReportResponse> =
      (input, done) => this.messagingParticipantReportingClient.fetchParticipantReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingParticipantReportingServiceApi.FetchParticipantReportRequest, messagingParticipantReportingServiceApi.FetchParticipantReportResponse>(invoke3, cloned3);
    const request4 = chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest.fromPartial({
      chatBot: {
        audit: {
          createdAt: req?.participant?.audit?.createdAt,
          updatedBy: (reply1?.fixedAsset?.audit?.updatedBy ?? ""),
        },
      },
      context: req?.context,
    });
    const decoded4 = chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest.toJSON(request4))),
    );
    const invoke4: Unary<chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest, chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse> =
      (input, done) => this.chatChatBotLifecycleClient.scheduleChatBotExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest, chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse>(invoke4, decoded4);
    const request5 = messagingChatMessageSyncServiceApi.StreamChatMessageChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
        subject: { displayName: (req?.details?.approver?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream5 = this.messagingChatMessageSyncClient.streamChatMessageChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantApprovalServiceApi.ApproveParticipantResponse.fromPartial({
        participant: { audit: { etag: (reply1?.fixedAsset?.audit?.etag ?? "") } },
      }),
      messagingParticipantApprovalServiceApi.ApproveParticipantResponse.fromPartial({ participant: { contact: { name: reply3?.participant?.name } } }),
      messagingParticipantApprovalServiceApi.ApproveParticipantResponse.fromPartial({
        participant: { audit: { createdBy: (reply4?.chatBot?.audit?.createdBy ?? "") } },
      }),
      messagingParticipantApprovalServiceApi.ApproveParticipantResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          primaryAddress: req?.participant?.primaryAddress,
        },
      }),
    );
  }

  /**
   * Comments a participant.
   */
  async commentParticipantApproval(req: messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest): Promise<messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "CommentParticipantApproval", req);
    this.logger.info("comment_participant_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.participant?.primaryAddress?.locality ?? ""),
          postalCode: (req?.participant?.primaryAddress?.postalCode ?? ""),
          region: (req?.participant?.primaryAddress?.region ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.QuoteChatMessageRequest",
      value: Buffer.from(messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest.encode(request1).finish()),
    });
    const unpacked1 = messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest.decode(envelope1.value);
    const invoke1: Unary<messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest, messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.quoteChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageCalculationServiceApi.QuoteChatMessageRequest, messagingChatMessageCalculationServiceApi.QuoteChatMessageResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse.fromPartial({ participant: { attributes: (reply1?.chatMessage?.attributes ?? {}) } }),
      messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          relationshipManager: req?.participant?.relationshipManager,
        },
      }),
    );
  }

  /**
   * Delegates a participant.
   */
  async delegateParticipantApproval(req: messagingParticipantApprovalServiceApi.DelegateParticipantApprovalRequest): Promise<messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "DelegateParticipantApproval", req);
    this.logger.info("delegate_participant_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (req?.participant?.primaryAddress?.countryCode ?? ""),
          lines: (req?.participant?.primaryAddress?.lines ?? []).map((value) => value),
          recipient: (req?.participant?.primaryAddress?.recipient ?? ""),
          region: (req?.participant?.primaryAddress?.region ?? ""),
        },
      },
    });
    const client1 = this.clients.get<notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient>("acme.notifications.v1.SubscriptionCalculationService");
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse> =
      (input, done) => client1.calculateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse>(invoke1, request1);
    const request2 = assetsFixedAssetCalculationServiceApi.CalculateFixedAssetRequest.fromPartial({
      context: req?.context,
      fixedAsset: {
        audit: { createdAt: reply1?.subscription?.audit?.createdAt },
        owner: { displayName: (reply1?.subscription?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<assetsFixedAssetCalculationServiceApi.CalculateFixedAssetRequest, assetsFixedAssetCalculationServiceApi.CalculateFixedAssetResponse> =
      (input, done) => this.assetsFixedAssetCalculationClient.calculateFixedAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<assetsFixedAssetCalculationServiceApi.CalculateFixedAssetRequest, assetsFixedAssetCalculationServiceApi.CalculateFixedAssetResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetRequest.fromPartial({
      campaignBudget: {
        contact: { email: (req?.participant?.relationshipManager?.email ?? "") },
        holder: { displayName: (reply2?.fixedAsset?.owner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke3: Unary<campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetRequest, campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse> =
      (input, done) => this.campaignsCampaignBudgetApprovalClient.rejectCampaignBudget(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetRequest, campaignsCampaignBudgetApprovalServiceApi.RejectCampaignBudgetResponse>(invoke3, request3));
    const request4 = notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          name: req?.participant?.contact?.name,
          phone: (req?.participant?.contact?.phone ?? ""),
          preferredChannel: (req?.participant?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke4: Unary<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.unsubscribeDeliveryAttemptUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await workflow("DelegateParticipantApproval.UnsubscribeDeliveryAttemptUpdates", () => call<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        participant: { audit: { etag: (reply1?.subscription?.audit?.etag ?? "") } },
      }),
      messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        participant: {
          primaryAddress: {
            recipient: ((reply2?.fixedAsset?.locator?.$case === "address" ? reply2?.fixedAsset?.locator.address : undefined)?.recipient ?? ""),
          },
        },
      }),
      messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse.fromPartial({ outcome: { message: (reply3?.result?.message ?? "") } }),
      messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse.fromPartial({ result: { correlationId: (reply4?.result?.correlationId ?? "") } }),
      messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse.fromPartial({
        participant: {
          name: req?.participant?.name,
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a participant.
   */
  async escalateParticipant(req: messagingParticipantApprovalServiceApi.EscalateParticipantRequest): Promise<messagingParticipantApprovalServiceApi.EscalateParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "EscalateParticipant", req);
    this.logger.info("escalate_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantReportingServiceApi.CountParticipantTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.participant?.identityDocument?.$case === "passport" ? req?.participant?.identityDocument.passport : undefined)?.expiresAt,
        region: (req?.participant?.primaryAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse> =
      (input, done) => this.messagingParticipantReportingClient.countParticipantTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = inventoryStockItemQueryServiceApi.ResolveStockItemsRequest.fromPartial({ context: req?.context });
    const reply2 = await this.workQueue.enqueue<inventoryStockItemQueryServiceApi.ResolveStockItemsRequest, inventoryStockItemQueryServiceApi.ResolveStockItemsResponse>(
      "acme.messaging.v1.ParticipantApprovalService/EscalateParticipant:1", request2,
    );
    const request3 = experimentsExposureApprovalServiceApi.RecallExposureRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { email: (req?.participant?.relationshipManager?.email ?? "") },
      },
      exposure: {
        correlationId: (reply2?.result?.correlationId ?? ""),
        subject: {
          displayName: (req?.participant?.relationshipManager?.displayName ?? ""),
        },
      },
    });
    const invoke3: Unary<experimentsExposureApprovalServiceApi.RecallExposureRequest, experimentsExposureApprovalServiceApi.RecallExposureResponse> =
      (input, done) => this.experimentsExposureApprovalClient.recallExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<experimentsExposureApprovalServiceApi.RecallExposureRequest, experimentsExposureApprovalServiceApi.RecallExposureResponse>(invoke3, request3));
    const request4 = formsFormWorkflowServiceApi.PauseFormWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: { preferredChannel: (req?.participant?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke4: Unary<formsFormWorkflowServiceApi.PauseFormWorkflowRequest, formsFormWorkflowServiceApi.PauseFormWorkflowResponse> =
      (input, done) => this.formsFormWorkflowClient.pauseFormWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<formsFormWorkflowServiceApi.PauseFormWorkflowResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request5 = notificationsNotificationSyncServiceApi.StreamNotificationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: req?.details?.approver,
        requester: req?.participant?.contact,
        subject: (req?.context?.actor?.userId ?? ""),
      } },
      context: req?.context,
    });
    const stream5 = this.notificationsNotificationSyncClient.streamNotificationChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? notificationsNotificationSyncServiceApi.StreamNotificationChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantApprovalServiceApi.EscalateParticipantResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      messagingParticipantApprovalServiceApi.EscalateParticipantResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      messagingParticipantApprovalServiceApi.EscalateParticipantResponse.fromPartial({
        result: {
          correlationId: (reply3?.exposure?.correlationId ?? ""),
          details: (reply3?.result?.details ?? {}),
        },
      }),
      messagingParticipantApprovalServiceApi.EscalateParticipantResponse.fromPartial({
        participant: {
          primaryAddress: {
            countryCode: (reply4?.form?.billingAddress?.countryCode ?? ""),
            postalCode: (reply4?.form?.billingAddress?.postalCode ?? ""),
          },
        },
      }),
      messagingParticipantApprovalServiceApi.EscalateParticipantResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          status: req?.participant?.status,
        },
      }),
    );
  }

  /**
   * Returns a participant.
   */
  async getParticipantApprovalStatus(req: messagingParticipantApprovalServiceApi.GetParticipantApprovalStatusRequest): Promise<messagingParticipantApprovalServiceApi.GetParticipantApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetParticipantApprovalStatus", req);
    this.logger.info("get_participant_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.participantId ?? ""),
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsRequest, notificationsDeliveryAttemptNotificationServiceApi.ListDeliveryAttemptSubscriptionsResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.listDeliveryAttemptSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      messagingParticipantApprovalServiceApi.GetParticipantApprovalStatusResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      messagingParticipantApprovalServiceApi.GetParticipantApprovalStatusResponse.fromPartial({ participant: { participantId: (req?.participantId ?? "") } }),
    );
  }

  /**
   * Lists participants a page at a time.
   */
  async listPendingParticipants(req: messagingParticipantApprovalServiceApi.ListPendingParticipantsRequest): Promise<messagingParticipantApprovalServiceApi.ListPendingParticipantsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingParticipants", req);
    this.logger.info("list_pending_participants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelApprovalServiceApi.ApproveChannelRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelApprovalServiceApi.ApproveChannelRequest, messagingChannelApprovalServiceApi.ApproveChannelResponse> =
      (input, done) => this.messagingChannelApprovalClient.approveChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingParticipantApprovalServiceApi.ListPendingParticipantsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } });
  }

  /**
   * Recalls a participant.
   */
  async recallParticipant(req: messagingParticipantApprovalServiceApi.RecallParticipantRequest): Promise<messagingParticipantApprovalServiceApi.RecallParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "RecallParticipant", req);
    this.logger.info("recall_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalRequest.fromPartial({
      affinity: {
        subject: {
          displayName: (req?.participant?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const method1 = "delegateAffinityApproval" as const;
    const invoke1: Unary<personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalRequest, personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalResponse> =
      (input, done) => this.personalizationAffinityApprovalClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalRequest, personalizationAffinityApprovalServiceApi.DelegateAffinityApprovalResponse>(invoke1, request1);
    const request2 = messagingParticipantLifecycleServiceApi.RenewParticipantRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: { email: (req?.participant?.relationshipManager?.email ?? "") },
        notifyContact: {
          name: req?.participant?.name,
          preferredChannel: (req?.participant?.contact?.preferredChannel ?? ""),
        },
      },
      participantId: (req?.participant?.participantId ?? ""),
    });
    const proxy2 = forwarding(this.messagingParticipantLifecycleClient);
    const invoke2: Unary<messagingParticipantLifecycleServiceApi.RenewParticipantRequest, messagingParticipantLifecycleServiceApi.RenewParticipantResponse> =
      (input, done) => proxy2.renewParticipant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingParticipantLifecycleServiceApi.RenewParticipantRequest, messagingParticipantLifecycleServiceApi.RenewParticipantResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantApprovalServiceApi.RecallParticipantResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      messagingParticipantApprovalServiceApi.RecallParticipantResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingParticipantApprovalServiceApi.RecallParticipantResponse.fromPartial({
        participant: {
          contact: req?.participant?.contact,
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a participant.
   */
  async rejectParticipant(req: messagingParticipantApprovalServiceApi.RejectParticipantRequest): Promise<messagingParticipantApprovalServiceApi.RejectParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "RejectParticipant", req);
    this.logger.info("reject_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = inventoryStockItemQueryServiceApi.ExportStockItemsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.participant?.identityDocument?.$case === "passport" ? req?.participant?.identityDocument.passport : undefined)?.expiresAt,
        region: (req?.participant?.primaryAddress?.region ?? ""),
      },
    });
    const stream1 = this.inventoryStockItemQueryClient.exportStockItems(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? inventoryStockItemQueryServiceApi.ExportStockItemsResponse.fromPartial({});
    const request2 = messagingParticipantReportingServiceApi.CountParticipantTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.participant?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.participant?.attributes ?? {}))),
        ownerId: (req?.participant?.relationshipManager?.userId ?? ""),
        region: (req?.participant?.primaryAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse> =
      (input, done) => this.messagingParticipantReportingClient.countParticipantTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse>(invoke2, request2);
    const request3 = notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          name: req?.participant?.contact?.name,
          phone: (req?.participant?.contact?.phone ?? ""),
          preferredChannel: (req?.participant?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse> =
      (input, done) => this.notificationsDeliveryAttemptNotificationClient.unsubscribeDeliveryAttemptUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesRequest, notificationsDeliveryAttemptNotificationServiceApi.UnsubscribeDeliveryAttemptUpdatesResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantApprovalServiceApi.RejectParticipantResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      messagingParticipantApprovalServiceApi.RejectParticipantResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      messagingParticipantApprovalServiceApi.RejectParticipantResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        participant: { participantId: (req?.participantId ?? "") },
      }),
    );
  }

  /**
   * Submits a participant.
   */
  async submitParticipant(req: messagingParticipantApprovalServiceApi.SubmitParticipantRequest): Promise<messagingParticipantApprovalServiceApi.SubmitParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "SubmitParticipant", req);
    this.logger.info("submit_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = formsFormWorkflowServiceApi.RetryFormWorkflowRequest.fromPartial({
      context: input1?.context,
      form: { counterparty: { email: (input1?.details?.approver?.email ?? "") } },
    });
    const invoke1: Unary<formsFormWorkflowServiceApi.RetryFormWorkflowRequest, formsFormWorkflowServiceApi.RetryFormWorkflowResponse> =
      (input, done) => this.formsFormWorkflowClient.retryFormWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormWorkflowServiceApi.RetryFormWorkflowRequest, formsFormWorkflowServiceApi.RetryFormWorkflowResponse>(invoke1, request1);
    const request2 = notificationsNotificationExportServiceApi.ListNotificationExportsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.form?.billingAddress?.region ?? "") },
    });
    const cloned2: notificationsNotificationExportServiceApi.ListNotificationExportsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<notificationsNotificationExportServiceApi.ListNotificationExportsRequest, notificationsNotificationExportServiceApi.ListNotificationExportsResponse> =
      (input, done) => this.notificationsNotificationExportClient.listNotificationExports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationExportServiceApi.ListNotificationExportsRequest, notificationsNotificationExportServiceApi.ListNotificationExportsResponse>(invoke2, cloned2);
    const request3 = messagingChatMessageApprovalServiceApi.SubmitChatMessageRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (reply1?.form?.counterparty?.email ?? "") } },
    });
    const decoded3 = messagingChatMessageApprovalServiceApi.SubmitChatMessageRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingChatMessageApprovalServiceApi.SubmitChatMessageRequest.toJSON(request3))),
    );
    const invoke3: Unary<messagingChatMessageApprovalServiceApi.SubmitChatMessageRequest, messagingChatMessageApprovalServiceApi.SubmitChatMessageResponse> =
      (input, done) => this.messagingChatMessageApprovalClient.submitChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingChatMessageApprovalServiceApi.SubmitChatMessageRequest, messagingChatMessageApprovalServiceApi.SubmitChatMessageResponse>(invoke3, decoded3);
    const request4 = featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.participant?.identityDocument?.$case === "passport" ? req?.participant?.identityDocument.passport : undefined)?.expiresAt,
        ownerId: (reply3?.chatMessage?.subject?.channelId ?? ""),
        region: (req?.participant?.primaryAddress?.region ?? ""),
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.featureflags.v1.CountFeatureFlagsRequest",
      value: Buffer.from(featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.encode(request4).finish()),
    });
    const unpacked4 = featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.decode(envelope4.value);
    const invoke4: Unary<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.countFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantApprovalServiceApi.SubmitParticipantResponse.fromPartial({
        participant: {
          relationshipManager: { email: (reply1?.form?.counterparty?.email ?? "") },
        },
      }),
      messagingParticipantApprovalServiceApi.SubmitParticipantResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingParticipantApprovalServiceApi.SubmitParticipantResponse.fromPartial({
        participant: {
          relationshipManager: { displayName: (reply3?.chatMessage?.subject?.displayName ?? "") },
        },
      }),
      messagingParticipantApprovalServiceApi.SubmitParticipantResponse.fromPartial({
        result: {
          message: (reply4?.result?.message ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      messagingParticipantApprovalServiceApi.SubmitParticipantResponse.fromPartial({
        participant: {
          attributes: (req?.participant?.attributes ?? {}),
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ParticipantApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ParticipantApprovalHandler {
  constructor(@inject(ParticipantApprovalWorkflow) private readonly workflow: ParticipantApprovalWorkflow) {}

  /**
   * Approves a participant.
   */
  approveParticipant = unary<messagingParticipantApprovalServiceApi.ApproveParticipantRequest, messagingParticipantApprovalServiceApi.ApproveParticipantResponse>(
    (request) => this.workflow.approveParticipant(request),
  );

  /**
   * Comments a participant.
   */
  commentParticipantApproval = unary<messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest, messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse>(
    (request) => this.workflow.commentParticipantApproval(request),
  );

  /**
   * Delegates a participant.
   */
  delegateParticipantApproval = (call: ServerUnaryCall<messagingParticipantApprovalServiceApi.DelegateParticipantApprovalRequest, messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse>, done: sendUnaryData<messagingParticipantApprovalServiceApi.DelegateParticipantApprovalResponse>): void => {
    void this.workflow.delegateParticipantApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a participant.
   */
  escalateParticipant = unary<messagingParticipantApprovalServiceApi.EscalateParticipantRequest, messagingParticipantApprovalServiceApi.EscalateParticipantResponse>(
    (request) => this.workflow.escalateParticipant(request),
  );

  /**
   * Returns a participant.
   */
  getParticipantApprovalStatus = unary<messagingParticipantApprovalServiceApi.GetParticipantApprovalStatusRequest, messagingParticipantApprovalServiceApi.GetParticipantApprovalStatusResponse>(
    (request) => this.workflow.getParticipantApprovalStatus(request),
  );

  /**
   * Lists participants a page at a time.
   */
  listPendingParticipants = (call: ServerUnaryCall<messagingParticipantApprovalServiceApi.ListPendingParticipantsRequest, messagingParticipantApprovalServiceApi.ListPendingParticipantsResponse>, done: sendUnaryData<messagingParticipantApprovalServiceApi.ListPendingParticipantsResponse>): void => {
    void this.workflow.listPendingParticipants(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a participant.
   */
  recallParticipant = unary<messagingParticipantApprovalServiceApi.RecallParticipantRequest, messagingParticipantApprovalServiceApi.RecallParticipantResponse>(
    (request) => this.workflow.recallParticipant(request),
  );

  /**
   * Rejects a participant.
   */
  rejectParticipant = unary<messagingParticipantApprovalServiceApi.RejectParticipantRequest, messagingParticipantApprovalServiceApi.RejectParticipantResponse>(
    (request) => this.workflow.rejectParticipant(request),
  );

  /**
   * Submits a participant.
   */
  submitParticipant = (call: ServerUnaryCall<messagingParticipantApprovalServiceApi.SubmitParticipantRequest, messagingParticipantApprovalServiceApi.SubmitParticipantResponse>, done: sendUnaryData<messagingParticipantApprovalServiceApi.SubmitParticipantResponse>): void => {
    void this.workflow.submitParticipant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ParticipantApprovalHandler): messagingParticipantApprovalServiceApi.ParticipantApprovalServiceServer {
  return {
    approveParticipant: handler.approveParticipant,
    commentParticipantApproval: handler.commentParticipantApproval,
    delegateParticipantApproval: handler.delegateParticipantApproval,
    escalateParticipant: handler.escalateParticipant,
    getParticipantApprovalStatus: handler.getParticipantApprovalStatus,
    listPendingParticipants: handler.listPendingParticipants,
    recallParticipant: handler.recallParticipant,
    rejectParticipant: handler.rejectParticipant,
    submitParticipant: handler.submitParticipant,
  };
}
