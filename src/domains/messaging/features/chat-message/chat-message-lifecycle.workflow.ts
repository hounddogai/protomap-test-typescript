/**
 * Moves a chat message between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceMemberApprovalServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as driversDriverServiceApi from "../../../../../.cache/proto/acme/drivers/v1/driver_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as messagingChannelReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import * as messagingChannelSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as messagingChatMessageLifecycleServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_lifecycle_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as messagingParticipantImportServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as messagingParticipantSyncServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  promised,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { collect, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toChatMessageRecord } from "../../data/records.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat message operations and persist audit data.
 */
@injectable()
export class ChatMessageLifecycleWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberApprovalService") private readonly audiencesAudienceMemberApprovalClient: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient,
    @inject("grpc:acme.drivers.v1.DriverService") private readonly driversDriverClient: driversDriverServiceApi.DriverServiceClient,
    @inject("grpc:acme.experiments.v1.VariantApprovalService") private readonly experimentsVariantApprovalClient: experimentsVariantApprovalServiceApi.VariantApprovalServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobSyncService") private readonly mediaTranscodeJobSyncClient: mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelReportingService") private readonly messagingChannelReportingClient: messagingChannelReportingServiceApi.ChannelReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelSyncService") private readonly messagingChannelSyncClient: messagingChannelSyncServiceApi.ChannelSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantCalculationService") private readonly messagingParticipantCalculationClient: messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantImportService") private readonly messagingParticipantImportClient: messagingParticipantImportServiceApi.ParticipantImportServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantSyncService") private readonly messagingParticipantSyncClient: messagingParticipantSyncServiceApi.ParticipantSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a chat message.
   */
  async activateChatMessage(req: messagingChatMessageLifecycleServiceApi.ActivateChatMessageRequest): Promise<messagingChatMessageLifecycleServiceApi.ActivateChatMessageResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateChatMessage", req);
    this.logger.info("activate_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberRequest.fromPartial({
      audienceMember: {
        relationshipManager: { userId: (req?.details?.newOwner?.userId ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberApprovalClient.escalateAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageLifecycleServiceApi.ActivateChatMessageResponse.fromPartial({
        chatMessage: { attributes: (reply1?.audienceMember?.attributes ?? {}) },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      messagingChatMessageLifecycleServiceApi.ActivateChatMessageResponse.fromPartial({
        chatMessage: { chatMessageId: (req?.chatMessageId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a chat message.
   */
  async expireChatMessage(req: messagingChatMessageLifecycleServiceApi.ExpireChatMessageRequest): Promise<messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireChatMessage", req);
    this.logger.info("expire_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.PreviewChatMessageRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const invoke1: Unary<messagingChatMessageValidationServiceApi.PreviewChatMessageRequest, messagingChatMessageValidationServiceApi.PreviewChatMessageResponse> =
      (input, done) => this.messagingChatMessageValidationClient.previewChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingChatMessageValidationServiceApi.PreviewChatMessageResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = messagingChannelReportingServiceApi.GenerateChannelReportRequest.fromPartial({
      channelId: (reply1?.chatMessage?.subject?.channelId ?? ""),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<messagingChannelReportingServiceApi.GenerateChannelReportRequest, messagingChannelReportingServiceApi.GenerateChannelReportResponse> =
      (input, done) => this.messagingChannelReportingClient.generateChannelReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = messagingParticipantSyncServiceApi.PullParticipantsRequest.fromPartial({
      context: req?.context,
      participant: {
        contact: {
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
        relationshipManager: { email: (req?.details?.notifyContact?.email ?? "") },
      },
    });
    const invoke3: Unary<messagingParticipantSyncServiceApi.PullParticipantsRequest, messagingParticipantSyncServiceApi.PullParticipantsResponse> =
      (input, done) => this.messagingParticipantSyncClient.pullParticipants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (reply3?.participant?.primaryAddress?.locality ?? "") },
      },
      participant: {
        audit: { etag: (reply3?.participant?.audit?.etag ?? "") },
        identityDocument: { $case: "passport", passport: {
          issuingCountry: ((reply3?.participant?.identityDocument?.$case === "nationalId" ? reply3?.participant?.identityDocument.nationalId : undefined)?.issuingCountry ?? ""),
        } },
      },
    });
    const method4 = "compareParticipantOptions" as const;
    const invoke4: Unary<messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest, messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse> =
      (input, done) => this.messagingParticipantCalculationClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest, messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.newOwner?.email ?? "") });
    return mergeResponses(
      messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse.fromPartial({
        chatMessage: {
          correlationId: (reply1?.chatMessage?.correlationId ?? ""),
          sequence: (reply1?.chatMessage?.sequence ?? 0),
        },
      }),
      messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse.fromPartial({
        chatMessage: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse.fromPartial({
        outcome: { message: (reply3?.outcome?.message ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse.fromPartial({
        chatMessage: { correlationId: (reply4?.result?.correlationId ?? "") },
        outcome: { message: (reply4?.result?.message ?? "") },
      }),
      messagingChatMessageLifecycleServiceApi.ExpireChatMessageResponse.fromPartial({
        chatMessage: { chatMessageId: (req?.chatMessageId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a chat message.
   */
  async getChatMessageLifecycle(req: messagingChatMessageLifecycleServiceApi.GetChatMessageLifecycleRequest): Promise<messagingChatMessageLifecycleServiceApi.GetChatMessageLifecycleResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatMessageLifecycle", req);
    this.logger.info("get_chat_message_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingChatMessageLifecycleServiceApi.GetChatMessageLifecycleResponse.fromPartial({ chatMessage: { chatMessageId: (req?.chatMessageId ?? "") } });
  }

  /**
   * Reinstates a chat message.
   */
  async reinstateChatMessage(req: messagingChatMessageLifecycleServiceApi.ReinstateChatMessageRequest): Promise<messagingChatMessageLifecycleServiceApi.ReinstateChatMessageResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateChatMessage", req);
    this.logger.info("reinstate_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const proxy1 = forwarding(this.featureflagsFeatureFlagQueryClient);
    const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse> =
      (input, done) => proxy1.browseFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse>(invoke1, request1);
    const request2 = experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
        },
      },
      variant: { owner: { userId: (req?.details?.newOwner?.userId ?? "") } },
    });
    const invoke2: Unary<experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest, experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse> =
      (input, done) => this.experimentsVariantApprovalClient.delegateVariantApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantApprovalServiceApi.DelegateVariantApprovalRequest, experimentsVariantApprovalServiceApi.DelegateVariantApprovalResponse>(invoke2, request2);
    const request3 = messagingParticipantImportServiceApi.ListParticipantImportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.variant?.audit?.createdAt,
        ownerId: (reply2?.variant?.owner?.userId ?? ""),
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<messagingParticipantImportServiceApi.ListParticipantImportsRequest, messagingParticipantImportServiceApi.ListParticipantImportsResponse> =
      (input, done) => this.messagingParticipantImportClient.listParticipantImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingParticipantImportServiceApi.ListParticipantImportsRequest, messagingParticipantImportServiceApi.ListParticipantImportsResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = messagingChannelSyncServiceApi.PushChannelRequest.fromPartial({
      channel: {
        owner: {
          email: (input4?.details?.notifyContact?.email ?? ""),
          userId: (reply2?.variant?.owner?.userId ?? ""),
        },
      },
      context: input4?.context,
    });
    const invoke4: Unary<messagingChannelSyncServiceApi.PushChannelRequest, messagingChannelSyncServiceApi.PushChannelResponse> =
      (input, done) => this.messagingChannelSyncClient.pushChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingChannelSyncServiceApi.PushChannelRequest, messagingChannelSyncServiceApi.PushChannelResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageLifecycleServiceApi.ReinstateChatMessageResponse.fromPartial({
        chatMessage: { correlationId: (reply1?.result?.correlationId ?? "") },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      messagingChatMessageLifecycleServiceApi.ReinstateChatMessageResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      messagingChatMessageLifecycleServiceApi.ReinstateChatMessageResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      messagingChatMessageLifecycleServiceApi.ReinstateChatMessageResponse.fromPartial({ outcome: { referenceId: (reply4?.outcome?.referenceId ?? "") } }),
      messagingChatMessageLifecycleServiceApi.ReinstateChatMessageResponse.fromPartial({
        chatMessage: { chatMessageId: (req?.chatMessageId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a chat message.
   */
  async renewChatMessage(req: messagingChatMessageLifecycleServiceApi.RenewChatMessageRequest): Promise<messagingChatMessageLifecycleServiceApi.RenewChatMessageResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewChatMessage", req);
    this.logger.info("renew_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionHistoryServiceApi.RevertSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const cloned1: notificationsSubscriptionHistoryServiceApi.RevertSubscriptionRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsSubscriptionHistoryServiceApi.RevertSubscriptionRequest, notificationsSubscriptionHistoryServiceApi.RevertSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionHistoryClient.revertSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionHistoryServiceApi.RevertSubscriptionRequest, notificationsSubscriptionHistoryServiceApi.RevertSubscriptionResponse>(invoke1, cloned1);
    const request2 = driversDriverServiceApi.ListDriversRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.subscription?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const decoded2 = driversDriverServiceApi.ListDriversRequest.fromJSON(
      JSON.parse(JSON.stringify(driversDriverServiceApi.ListDriversRequest.toJSON(request2))),
    );
    const invoke2: Unary<driversDriverServiceApi.ListDriversRequest, driversDriverServiceApi.ListDriversResponse> =
      (input, done) => this.driversDriverClient.listDrivers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<driversDriverServiceApi.ListDriversRequest, driversDriverServiceApi.ListDriversResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageLifecycleServiceApi.RenewChatMessageResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingChatMessageLifecycleServiceApi.RenewChatMessageResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingChatMessageLifecycleServiceApi.RenewChatMessageResponse.fromPartial({
        chatMessage: { chatMessageId: (req?.chatMessageId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a chat message.
   */
  async scheduleChatMessageExpiry(req: messagingChatMessageLifecycleServiceApi.ScheduleChatMessageExpiryRequest): Promise<messagingChatMessageLifecycleServiceApi.ScheduleChatMessageExpiryResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "ScheduleChatMessageExpiry", req);
    this.logger.info("schedule_chat_message_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.ValidateChatMessageRequest.fromPartial({
      chatMessage: {
        chatMessageId: (req?.chatMessage?.chatMessageId ?? ""),
        subject: {
          code: (req?.chatMessage?.subject?.code ?? ""),
          displayName: (req?.chatMessage?.subject?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { phone: (req?.details?.notify?.phone ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.ValidateChatMessageRequest",
      value: Buffer.from(messagingChatMessageValidationServiceApi.ValidateChatMessageRequest.encode(request1).finish()),
    });
    const unpacked1 = messagingChatMessageValidationServiceApi.ValidateChatMessageRequest.decode(envelope1.value);
    const invoke1: Unary<messagingChatMessageValidationServiceApi.ValidateChatMessageRequest, messagingChatMessageValidationServiceApi.ValidateChatMessageResponse> =
      (input, done) => this.messagingChatMessageValidationClient.validateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageValidationServiceApi.ValidateChatMessageRequest, messagingChatMessageValidationServiceApi.ValidateChatMessageResponse>(invoke1, unpacked1);
    const request2 = mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        assignee: {
          displayName: (req?.chatMessage?.subject?.displayName ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        subject: (req?.chatMessage?.chatMessageId ?? ""),
      } },
      context: req?.context,
    });
    const stream2 = this.mediaTranscodeJobSyncClient.streamTranscodeJobChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? mediaTranscodeJobSyncServiceApi.StreamTranscodeJobChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageLifecycleServiceApi.ScheduleChatMessageExpiryResponse.fromPartial({
        chatMessage: { correlationId: (reply1?.chatMessage?.correlationId ?? "") },
      }),
      messagingChatMessageLifecycleServiceApi.ScheduleChatMessageExpiryResponse.fromPartial({
        chatMessage: { chatMessageId: (req?.chatMessageId ?? "") },
        result: { correlationId: (req?.chatMessage?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Suspends a chat message.
   */
  async suspendChatMessage(req: messagingChatMessageLifecycleServiceApi.SuspendChatMessageRequest): Promise<messagingChatMessageLifecycleServiceApi.SuspendChatMessageResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendChatMessage", req);
    this.logger.info("suspend_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantSyncServiceApi.SyncParticipantsRequest.fromPartial({
      context: req?.context,
      participant: {
        relationshipManager: {
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const client1 = this.clients.get<messagingParticipantSyncServiceApi.ParticipantSyncServiceClient>("acme.messaging.v1.ParticipantSyncService");
    const invoke1: Unary<messagingParticipantSyncServiceApi.SyncParticipantsRequest, messagingParticipantSyncServiceApi.SyncParticipantsResponse> =
      (input, done) => client1.syncParticipants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingParticipantSyncServiceApi.SyncParticipantsRequest, messagingParticipantSyncServiceApi.SyncParticipantsResponse>(invoke1, request1);
    const request2 = messagingParticipantImportServiceApi.MapParticipantImportColumnsRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: reply1?.participant?.contact?.name } },
      participant: {
        identityDocument: { $case: "passport", passport: {
          expiresAt: (reply1?.participant?.identityDocument?.$case === "passport" ? reply1?.participant?.identityDocument.passport : undefined)?.expiresAt,
          number: ((reply1?.participant?.identityDocument?.$case === "passport" ? reply1?.participant?.identityDocument.passport : undefined)?.number ?? ""),
        } },
      },
    });
    const invoke2: Unary<messagingParticipantImportServiceApi.MapParticipantImportColumnsRequest, messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse> =
      (input, done) => this.messagingParticipantImportClient.mapParticipantImportColumns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<messagingParticipantImportServiceApi.MapParticipantImportColumnsRequest, messagingParticipantImportServiceApi.MapParticipantImportColumnsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageLifecycleServiceApi.SuspendChatMessageResponse.fromPartial({
        chatMessage: {
          subject: {
            displayName: (reply1?.participant?.relationshipManager?.displayName ?? ""),
          },
        },
      }),
      messagingChatMessageLifecycleServiceApi.SuspendChatMessageResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingChatMessageLifecycleServiceApi.SuspendChatMessageResponse.fromPartial({
        chatMessage: { chatMessageId: (req?.chatMessageId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
