/**
 * Keeps participants in step with the systems of record in other regions. Remote work stays behind typed client
 * ports.
 */

import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as mediaTranscodeJobWorkflowServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_workflow_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as messagingParticipantSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as sellersSellerCalculationServiceApi from "../../../../.cache/proto/acme/sellers/v1/seller_calculation_service.js";
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
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toParticipantRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate participant operations and persist audit data.
 */
@injectable()
export class ParticipantSyncWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobWorkflowService") private readonly mediaTranscodeJobWorkflowClient: mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.sellers.v1.SellerCalculationService") private readonly sellersSellerCalculationClient: sellersSellerCalculationServiceApi.SellerCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Returns a participant.
   */
  async getParticipantSyncState(req: messagingParticipantSyncServiceApi.GetParticipantSyncStateRequest): Promise<messagingParticipantSyncServiceApi.GetParticipantSyncStateResponse> {
    validateContext(req.context);
    if (!req.participantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "participant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetParticipantSyncState", req);
    this.logger.info("get_participant_sync_state", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest.fromPartial({
      chatMessage: { source: (req?.participantId ?? "") },
      context: req?.context,
    });
    const method1 = "reconcileChatMessages" as const;
    const invoke1: Unary<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse>(invoke1, request1);
    return mergeResponses(
      messagingParticipantSyncServiceApi.GetParticipantSyncStateResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      messagingParticipantSyncServiceApi.GetParticipantSyncStateResponse.fromPartial({ participant: { participantId: (req?.participantId ?? "") } }),
    );
  }

  /**
   * Lists participants a page at a time.
   */
  async listParticipantConflicts(req: messagingParticipantSyncServiceApi.ListParticipantConflictsRequest): Promise<messagingParticipantSyncServiceApi.ListParticipantConflictsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListParticipantConflicts", req);
    this.logger.info("list_participant_conflicts", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingParticipantSyncServiceApi.ListParticipantConflictsResponse.fromPartial({});
  }

  /**
   * Pulls a participant.
   */
  async pullParticipants(req: messagingParticipantSyncServiceApi.PullParticipantsRequest): Promise<messagingParticipantSyncServiceApi.PullParticipantsResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "PullParticipants", req);
    this.logger.info("pull_participants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest.fromPartial({
      channel: {
        locator: { $case: "address", address: { locality: (req?.participant?.primaryAddress?.locality ?? "") } },
        audit: { createdAt: req?.participant?.audit?.createdAt },
        owner: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          userId: (req?.participant?.relationshipManager?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy1 = forwarding(this.messagingChannelCalculationClient);
    const invoke1: Unary<messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest, messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse> =
      (input, done) => proxy1.explainChannelCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest, messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse>(invoke1, request1);
    const request2 = notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.channel?.specs ?? {}))),
        period: req?.participant?.preferences?.quietHours,
      },
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest, notificationsNotificationQueryServiceApi.SummarizeNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.summarizeNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest, notificationsNotificationQueryServiceApi.SummarizeNotificationsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.checksum ?? "") });
    return mergeResponses(
      messagingParticipantSyncServiceApi.PullParticipantsResponse.fromPartial({
        participant: { audit: { createdBy: (reply1?.channel?.audit?.createdBy ?? "") } },
      }),
      messagingParticipantSyncServiceApi.PullParticipantsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      messagingParticipantSyncServiceApi.PullParticipantsResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          primaryAddress: req?.participant?.primaryAddress,
        },
      }),
    );
  }

  /**
   * Pushs a participant.
   */
  async pushParticipant(req: messagingParticipantSyncServiceApi.PushParticipantRequest): Promise<messagingParticipantSyncServiceApi.PushParticipantResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "PushParticipant", req);
    this.logger.info("push_participant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: {
          number: ((req?.participant?.identityDocument?.$case === "nationalId" ? req?.participant?.identityDocument.nationalId : undefined)?.number ?? ""),
        },
      },
      details: {
        notify: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          phone: (req?.participant?.contact?.phone ?? ""),
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.startDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest.fromPartial({
      context: input2?.context,
      ledgerAccount: { contact: { name: input2?.participant?.contact?.name } },
    });
    const invoke2: Unary<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.normalizeLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>(invoke2, request2);
    const request3 = messagingChatMessageSyncServiceApi.StreamChatMessageChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        source: (reply1?.deliveryAttempt?.source ?? ""),
        subject: {
          displayName: (req?.participant?.relationshipManager?.displayName ?? ""),
        },
      } },
      context: req?.context,
    });
    const stream3 = this.messagingChatMessageSyncClient.streamChatMessageChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? messagingChatMessageSyncServiceApi.StreamChatMessageChangesResponse.fromPartial({});
    const request4 = messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.participant?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply2?.ledgerAccount?.labels ?? {}))),
        ownerId: (reply1?.deliveryAttempt?.subject?.notificationTemplateId ?? ""),
        region: (req?.participant?.primaryAddress?.region ?? ""),
      },
    });
    const cloned4: messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest, messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse> =
      (input, done) => this.messagingChatMessageSyncClient.listChatMessageConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingChatMessageSyncServiceApi.ListChatMessageConflictsRequest, messagingChatMessageSyncServiceApi.ListChatMessageConflictsResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantSyncServiceApi.PushParticipantResponse.fromPartial({
        result: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      messagingParticipantSyncServiceApi.PushParticipantResponse.fromPartial({
        outcome: { message: (reply2?.outcome?.message ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      messagingParticipantSyncServiceApi.PushParticipantResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      messagingParticipantSyncServiceApi.PushParticipantResponse.fromPartial({
        participant: {
          contact: req?.participant?.contact,
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Reconciles a participant.
   */
  async reconcileParticipants(req: messagingParticipantSyncServiceApi.ReconcileParticipantsRequest): Promise<messagingParticipantSyncServiceApi.ReconcileParticipantsResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "ReconcileParticipants", req);
    this.logger.info("reconcile_participants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: { preferredChannel: (req?.participant?.contact?.preferredChannel ?? "") },
      },
      transcodeJob: {
        assignee: {
          displayName: (req?.participant?.relationshipManager?.displayName ?? ""),
        },
        audit: { updatedBy: (req?.participant?.audit?.updatedBy ?? "") },
      },
    });
    const decoded1 = mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest.toJSON(request1))),
    );
    const invoke1: Unary<mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse> =
      (input, done) => this.mediaTranscodeJobWorkflowClient.resumeTranscodeJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse>(invoke1, decoded1);
    const request2 = messagingChannelCalculationServiceApi.QuoteChannelRequest.fromPartial({
      channel: { audit: { updatedAt: req?.participant?.audit?.updatedAt } },
      context: req?.context,
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.QuoteChannelRequest",
      value: Buffer.from(messagingChannelCalculationServiceApi.QuoteChannelRequest.encode(request2).finish()),
    });
    const unpacked2 = messagingChannelCalculationServiceApi.QuoteChannelRequest.decode(envelope2.value);
    const invoke2: Unary<messagingChannelCalculationServiceApi.QuoteChannelRequest, messagingChannelCalculationServiceApi.QuoteChannelResponse> =
      (input, done) => this.messagingChannelCalculationClient.quoteChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChannelCalculationServiceApi.QuoteChannelRequest, messagingChannelCalculationServiceApi.QuoteChannelResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantSyncServiceApi.ReconcileParticipantsResponse.fromPartial({
        participant: {
          relationshipManager: {
            email: ((reply1?.transcodeJob?.origin?.$case === "customer" ? reply1?.transcodeJob?.origin.customer : undefined)?.email ?? ""),
          },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingParticipantSyncServiceApi.ReconcileParticipantsResponse.fromPartial({
        participant: {
          primaryAddress: {
            countryCode: ((reply2?.channel?.locator?.$case === "address" ? reply2?.channel?.locator.address : undefined)?.countryCode ?? ""),
            lines: ((reply2?.channel?.locator?.$case === "address" ? reply2?.channel?.locator.address : undefined)?.lines ?? []),
          },
        },
      }),
      messagingParticipantSyncServiceApi.ReconcileParticipantsResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          status: req?.participant?.status,
        },
      }),
    );
  }

  /**
   * Resolves a participant.
   */
  async resolveParticipantConflict(req: messagingParticipantSyncServiceApi.ResolveParticipantConflictRequest): Promise<messagingParticipantSyncServiceApi.ResolveParticipantConflictResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "ResolveParticipantConflict", req);
    this.logger.info("resolve_participant_conflict", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.SyncChatMessagesRequest.fromPartial({
      chatMessage: {
        attributes: Object.fromEntries(Object.entries((req?.participant?.attributes ?? {}))),
        subject: {
          displayName: (req?.participant?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: { cursor: (req?.details?.cursor ?? "") },
    });
    const client1 = this.clients.get<messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient>("acme.messaging.v1.ChatMessageSyncService");
    const invoke1: Unary<messagingChatMessageSyncServiceApi.SyncChatMessagesRequest, messagingChatMessageSyncServiceApi.SyncChatMessagesResponse> =
      (input, done) => client1.syncChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageSyncServiceApi.SyncChatMessagesRequest, messagingChatMessageSyncServiceApi.SyncChatMessagesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantSyncServiceApi.ResolveParticipantConflictResponse.fromPartial({
        participant: {
          relationshipManager: { displayName: (reply1?.chatMessage?.subject?.displayName ?? "") },
        },
        result: { correlationId: (reply1?.chatMessage?.correlationId ?? "") },
      }),
      messagingParticipantSyncServiceApi.ResolveParticipantConflictResponse.fromPartial({
        participant: {
          attributes: (req?.participant?.attributes ?? {}),
          participantId: (req?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Exchanges changes of participants with a peer.
   */
  async streamParticipantChanges(req: messagingParticipantSyncServiceApi.StreamParticipantChangesRequest): Promise<messagingParticipantSyncServiceApi.StreamParticipantChangesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamParticipantChanges", req);
    this.logger.info("stream_participant_changes", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.ScoreConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: {
          displayName: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.relationshipManager?.displayName ?? ""),
        },
        comments: [{
          createdAt: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.audit?.createdAt,
        }],
        requester: {
          phone: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.contact?.phone ?? ""),
        },
      },
      details: {
        destination: {
          recipient: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.primaryAddress?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.scoreConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = messagingConversationCalculationServiceApi.CalculateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: {
          displayName: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.displayName ?? ""),
        },
        audit: { updatedBy: (reply1?.conversation?.audit?.updatedBy ?? "") },
        requester: {
          email: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.relationshipManager?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<messagingConversationCalculationServiceApi.CalculateConversationRequest, messagingConversationCalculationServiceApi.CalculateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.calculateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<messagingConversationCalculationServiceApi.CalculateConversationRequest, messagingConversationCalculationServiceApi.CalculateConversationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.cursor ?? "") });
    return mergeResponses(
      messagingParticipantSyncServiceApi.StreamParticipantChangesResponse.fromPartial({ participant: { name: reply1?.conversation?.requester?.name } }),
      messagingParticipantSyncServiceApi.StreamParticipantChangesResponse.fromPartial({
        participant: {
          relationshipManager: { email: (reply2?.conversation?.requester?.email ?? "") },
        },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      messagingParticipantSyncServiceApi.StreamParticipantChangesResponse.fromPartial({
        participant: {
          contact: (req?.frame?.$case === "change" ? req?.frame.change : undefined)?.contact,
          participantId: ((req?.frame?.$case === "change" ? req?.frame.change : undefined)?.participantId ?? ""),
        },
      }),
    );
  }

  /**
   * Syncs a participant.
   */
  async syncParticipants(req: messagingParticipantSyncServiceApi.SyncParticipantsRequest): Promise<messagingParticipantSyncServiceApi.SyncParticipantsResponse> {
    validateContext(req.context);
    if (req.participant) {
      await this.repository.save(toParticipantRecord(req.context.tenantId, req.participant));
    }
    await this.repository.record(req.context.tenantId, "SyncParticipants", req);
    this.logger.info("sync_participants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationCalculationServiceApi.RecalculateConversationsRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { email: (req?.participant?.relationshipManager?.email ?? "") },
      },
      details: {
        destination: { countryCode: (req?.participant?.primaryAddress?.countryCode ?? "") },
      },
    });
    const invoke1: Unary<messagingConversationCalculationServiceApi.RecalculateConversationsRequest, messagingConversationCalculationServiceApi.RecalculateConversationsResponse> =
      (input, done) => this.messagingConversationCalculationClient.recalculateConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("SyncParticipants.RecalculateConversations", () => call<messagingConversationCalculationServiceApi.RecalculateConversationsRequest, messagingConversationCalculationServiceApi.RecalculateConversationsResponse>(invoke1, request1));
    const request2 = sellersSellerCalculationServiceApi.QuoteSellerRequest.fromPartial({
      context: req?.context,
      seller: {
        contact: {
          email: (req?.participant?.relationshipManager?.email ?? ""),
          phone: (req?.participant?.contact?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<sellersSellerCalculationServiceApi.QuoteSellerRequest, sellersSellerCalculationServiceApi.QuoteSellerResponse> =
      (input, done) => this.sellersSellerCalculationClient.quoteSeller(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.channelId ?? ""),
          code: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.code ?? ""),
          displayName: (reply2?.seller?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: { resolution: (req?.details?.resolution ?? "") },
    });
    const reply3 = await this.workQueue.enqueue<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse>(
      "acme.messaging.v1.ParticipantSyncService/SyncParticipants:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingParticipantSyncServiceApi.SyncParticipantsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      messagingParticipantSyncServiceApi.SyncParticipantsResponse.fromPartial({
        participant: {
          primaryAddress: { locality: (reply2?.seller?.primaryAddress?.locality ?? "") },
        },
      }),
      messagingParticipantSyncServiceApi.SyncParticipantsResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { correlationId: (reply3?.chatMessage?.correlationId ?? "") },
      }),
      messagingParticipantSyncServiceApi.SyncParticipantsResponse.fromPartial({
        participant: {
          participantId: (req?.participantId ?? ""),
          relationshipManager: req?.participant?.relationshipManager,
        },
      }),
    );
  }
}
