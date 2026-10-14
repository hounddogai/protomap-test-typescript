/**
 * Keeps channels in step with the systems of record in other regions. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceSyncWorkflowServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import * as authorizationAccessPolicyValidationServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as concessionsConcessionStandServiceApi from "../../../../.cache/proto/acme/concessions/v1/concession_stand_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as messagingChannelSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import * as googleTimestampApi from "../../../../.cache/proto/google/protobuf/timestamp.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
import { toChannelRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate channel operations and persist audit data.
 */
@injectable()
export class ChannelSyncWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceSyncWorkflowService") private readonly audiencesAudienceSyncWorkflowClient: audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandService") private readonly concessionsConcessionStandClient: concessionsConcessionStandServiceApi.ConcessionStandServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationService") private readonly messagingConversationClient: messagingConversationServiceApi.ConversationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a channel.
   */
  async getChannelSyncState(req: messagingChannelSyncServiceApi.GetChannelSyncStateRequest): Promise<messagingChannelSyncServiceApi.GetChannelSyncStateResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChannelSyncState", req);
    this.logger.info("get_channel_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingChannelSyncServiceApi.GetChannelSyncStateResponse.fromPartial({ channel: { channelId: (req?.channelId ?? "") } });
  }

  /**
   * Lists channels a page at a time.
   */
  async listChannelConflicts(req: messagingChannelSyncServiceApi.ListChannelConflictsRequest): Promise<messagingChannelSyncServiceApi.ListChannelConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChannelConflicts", req);
    this.logger.info("list_channel_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.LintConversationsRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        audit: { updatedAt: req?.filter?.createdAfter },
      },
      details: { locale: (req?.context?.locale ?? "") },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.LintConversationsRequest",
      value: Buffer.from(messagingConversationValidationServiceApi.LintConversationsRequest.encode(request1).finish()),
    });
    const unpacked1 = messagingConversationValidationServiceApi.LintConversationsRequest.decode(envelope1.value);
    const invoke1: Unary<messagingConversationValidationServiceApi.LintConversationsRequest, messagingConversationValidationServiceApi.LintConversationsResponse> =
      (input, done) => this.messagingConversationValidationClient.lintConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationValidationServiceApi.LintConversationsRequest, messagingConversationValidationServiceApi.LintConversationsResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChannelSyncServiceApi.ListChannelConflictsResponse.fromPartial({
      result: {
        message: (reply1?.result?.message ?? ""),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Pulls a channel.
   */
  async pullChannels(req: messagingChannelSyncServiceApi.PullChannelsRequest): Promise<messagingChannelSyncServiceApi.PullChannelsResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "PullChannels", req);
    this.logger.info("pull_channels", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyRequest.fromPartial({
      accessPolicy: {
        audit: {
          createdBy: (req?.channel?.audit?.createdBy ?? ""),
          etag: (req?.channel?.audit?.etag ?? ""),
        },
        owner: { userId: (req?.channel?.owner?.userId ?? "") },
      },
      context: req?.context,
    });
    const client1 = this.clients.get<authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient>("acme.authorization.v1.AccessPolicyValidationService");
    const invoke1: Unary<authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyResponse> =
      (input, done) => client1.previewAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.PreviewAccessPolicyResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelSyncServiceApi.PullChannelsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingChannelSyncServiceApi.PullChannelsResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          owner: req?.channel?.owner,
        },
      }),
    );
  }

  /**
   * Pushs a channel.
   */
  async pushChannel(req: messagingChannelSyncServiceApi.PushChannelRequest): Promise<messagingChannelSyncServiceApi.PushChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "PushChannel", req);
    this.logger.info("push_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = concessionsConcessionStandServiceApi.WatchConcessionStandsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.channel?.audit?.createdAt,
        region: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.region ?? ""),
      },
      subscriber: { email: (req?.channel?.owner?.email ?? "") },
    });
    const stream1 = this.concessionsConcessionStandClient.watchConcessionStands(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? concessionsConcessionStandServiceApi.WatchConcessionStandsResponse.fromPartial({});
    const request2 = localizationLocaleApprovalServiceApi.SubmitLocaleRequest.fromPartial({
      context: req?.context,
      details: { approver: { displayName: (req?.channel?.owner?.displayName ?? "") } },
      locale: { audit: { updatedBy: (req?.channel?.audit?.updatedBy ?? "") } },
    });
    const invoke2: Unary<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.submitLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelSyncServiceApi.PushChannelResponse.fromPartial({
        channel: {
          audit: { updatedAt: reply2?.locale?.audit?.updatedAt },
          owner: { userId: (reply2?.locale?.owner?.userId ?? "") },
        },
      }),
      messagingChannelSyncServiceApi.PushChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          specs: (req?.channel?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Reconciles a channel.
   */
  async reconcileChannels(req: messagingChannelSyncServiceApi.ReconcileChannelsRequest): Promise<messagingChannelSyncServiceApi.ReconcileChannelsResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ReconcileChannels", req);
    this.logger.info("reconcile_channels", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.ValidateChatMessageRequest.fromPartial({
      chatMessage: {
        measurements: [{ unit: (req?.channel?.dimensions?.unit ?? "") }],
        subject: {
          code: (req?.channel?.code ?? ""),
          displayName: (req?.channel?.owner?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { email: (req?.channel?.owner?.email ?? "") } },
    });
    const invoke1: Unary<messagingChatMessageValidationServiceApi.ValidateChatMessageRequest, messagingChatMessageValidationServiceApi.ValidateChatMessageResponse> =
      (input, done) => this.messagingChatMessageValidationClient.validateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<messagingChatMessageValidationServiceApi.ValidateChatMessageRequest, messagingChatMessageValidationServiceApi.ValidateChatMessageResponse>(invoke1, request1));
    const request2 = messagingChatMessageSyncServiceApi.PullChatMessagesRequest.fromPartial({
      chatMessage: {
        subject: {
          code: (reply1?.chatMessage?.subject?.code ?? ""),
          displayName: (reply1?.chatMessage?.subject?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.pullChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ReconcileChannels.PullChatMessages", () => call<messagingChatMessageSyncServiceApi.PullChatMessagesRequest, messagingChatMessageSyncServiceApi.PullChatMessagesResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelSyncServiceApi.ReconcileChannelsResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingChannelSyncServiceApi.ReconcileChannelsResponse.fromPartial({
        channel: {
          owner: { displayName: (reply2?.chatMessage?.subject?.displayName ?? "") },
        },
      }),
      messagingChannelSyncServiceApi.ReconcileChannelsResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          specs: (req?.channel?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Resolves a channel.
   */
  async resolveChannelConflict(req: messagingChannelSyncServiceApi.ResolveChannelConflictRequest): Promise<messagingChannelSyncServiceApi.ResolveChannelConflictResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ResolveChannelConflict", req);
    this.logger.info("resolve_channel_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionCalculationServiceApi.QuoteSubscriptionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.countryCode ?? ""),
          lines: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.lines ?? []).map((value) => value),
          postalCode: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.postalCode ?? ""),
          recipient: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.QuoteSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.QuoteSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.quoteSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelSyncServiceApi.ResolveChannelConflictResponse.fromPartial({
        channel: { owner: { email: (reply1?.subscription?.owner?.email ?? "") } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      messagingChannelSyncServiceApi.ResolveChannelConflictResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          code: (req?.channel?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of channels with a peer.
   */
  async streamChannelChanges(req: messagingChannelSyncServiceApi.StreamChannelChangesRequest): Promise<messagingChannelSyncServiceApi.StreamChannelChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamChannelChanges", req);
    this.logger.info("stream_channel_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationExportServiceApi.ShareNotificationExportRequest.fromPartial({
      context: req?.context,
      details: {
        channel: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.channelId ?? ""),
        recipient: {
          email: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.owner?.email ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<notificationsNotificationExportServiceApi.ShareNotificationExportRequest, notificationsNotificationExportServiceApi.ShareNotificationExportResponse>(
      "acme.messaging.v1.ChannelSyncService/StreamChannelChanges:0", request1,
    );
    let selected2_1: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected2_1 = (((choice) => choice?.$case === "address" ? choice.address : undefined)((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.locator)?.region ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_2: googleTimestampApi.Timestamp | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected2_2 = (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.updatedAt;
        break;
      default:
        selected2_2 = undefined;
    }
    let selected2_3: string | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected2_3 = ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.owner?.userId ?? "");
        break;
      default:
        selected2_3 = "";
    }
    let selected2_4: Record<string, string> | undefined;
    switch (req?.frame?.$case) {
      case "change":
        selected2_4 = ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.specs ?? {});
        break;
      default:
        selected2_4 = {};
    }
    const request2 = audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: selected2_2,
        labels: (selected2_4 ?? {}),
        ownerId: (selected2_3 ?? ""),
        region: (selected2_1 ?? ""),
      },
    });
    const invoke2: Unary<audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsRequest, audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsResponse> =
      (input, done) => this.audiencesAudienceSyncWorkflowClient.listAudienceSyncWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsRequest, audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsResponse>(invoke2, request2);
    const request3 = messagingConversationServiceApi.BatchGetConversationsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<messagingConversationServiceApi.BatchGetConversationsRequest, messagingConversationServiceApi.BatchGetConversationsResponse> =
      (input, done) => this.messagingConversationClient.batchGetConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<messagingConversationServiceApi.BatchGetConversationsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.notification?.audit?.createdAt,
        ownerId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.owner?.userId ?? ""),
        region: (((choice) => choice?.$case === "address" ? choice.address : undefined)((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.locator)?.region ?? ""),
      },
    });
    const invoke4: Unary<messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest, messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse> =
      (input, done) => this.messagingChatMessageSyncClient.listChatMessageConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      messagingChannelSyncServiceApi.StreamChannelChangesResponse.fromPartial({ channel: { tags: (reply1?.notification?.tags ?? []) } }),
      messagingChannelSyncServiceApi.StreamChannelChangesResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      messagingChannelSyncServiceApi.StreamChannelChangesResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      messagingChannelSyncServiceApi.StreamChannelChangesResponse.fromPartial({
        result: {
          details: (reply4?.result?.details ?? {}),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      messagingChannelSyncServiceApi.StreamChannelChangesResponse.fromPartial({
        channel: {
          specs: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.specs ?? {}),
          status: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.status,
        },
      }),
    );
  }

  /**
   * Syncs a channel.
   */
  async syncChannels(req: messagingChannelSyncServiceApi.SyncChannelsRequest): Promise<messagingChannelSyncServiceApi.SyncChannelsResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "SyncChannels", req);
    this.logger.info("sync_channels", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.PushChatMessageRequest.fromPartial({
      chatMessage: {
        measurements: [{ unit: (req?.channel?.dimensions?.unit ?? "") }],
        subject: { code: (req?.channel?.code ?? "") },
      },
      context: req?.context,
      details: { cursor: (req?.details?.cursor ?? "") },
    });
    const invoke1: Unary<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse> =
      (input, done) => this.messagingChatMessageSyncClient.pushChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest.fromPartial({
      context: req?.context,
      locale: { owner: { userId: (req?.channel?.owner?.userId ?? "") } },
    });
    const method2 = "commentLocaleApproval" as const;
    const invoke2: Unary<localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest, localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse> =
      (input, done) => this.localizationLocaleApprovalClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest, localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelSyncServiceApi.SyncChannelsResponse.fromPartial({
        channel: { channelId: (reply1?.chatMessage?.subject?.channelId ?? "") },
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
      }),
      messagingChannelSyncServiceApi.SyncChannelsResponse.fromPartial({
        channel: { audit: { createdBy: (reply2?.locale?.audit?.createdBy ?? "") } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      messagingChannelSyncServiceApi.SyncChannelsResponse.fromPartial({
        channel: {
          capacity: (req?.channel?.capacity ?? 0),
          owner: req?.channel?.owner,
        },
      }),
    );
  }
}
