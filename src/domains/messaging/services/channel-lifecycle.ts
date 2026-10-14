/**
 * Moves a channel between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as mediaRenditionReportingServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import * as messagingChannelReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import * as messagingChatMessageReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_reporting_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as messagingParticipantImportServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as messagingParticipantReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as venuesVenueServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
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
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChannelRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate channel operations and persist audit data.
 */
@injectable()
export class ChannelLifecycleWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.media.v1.RenditionReportingService") private readonly mediaRenditionReportingClient: mediaRenditionReportingServiceApi.RenditionReportingServiceClient,
    @inject("grpc:acme.media.v1.TranscodeJobApprovalService") private readonly mediaTranscodeJobApprovalClient: mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelReportingService") private readonly messagingChannelReportingClient: messagingChannelReportingServiceApi.ChannelReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageReportingService") private readonly messagingChatMessageReportingClient: messagingChatMessageReportingServiceApi.ChatMessageReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantImportService") private readonly messagingParticipantImportClient: messagingParticipantImportServiceApi.ParticipantImportServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantReportingService") private readonly messagingParticipantReportingClient: messagingParticipantReportingServiceApi.ParticipantReportingServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryApprovalService") private readonly webhooksWebhookDeliveryApprovalClient: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a channel.
   */
  async activateChannel(req: messagingChannelLifecycleServiceApi.ActivateChannelRequest): Promise<messagingChannelLifecycleServiceApi.ActivateChannelResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateChannel", req);
    this.logger.info("activate_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationReportingServiceApi.ShareConversationReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingConversationReportingServiceApi.ShareConversationReportRequest, messagingConversationReportingServiceApi.ShareConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.shareConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ActivateChannel.ShareConversationReport", () => call<messagingConversationReportingServiceApi.ShareConversationReportRequest, messagingConversationReportingServiceApi.ShareConversationReportResponse>(invoke1, request1));
    const request2 = messagingConversationReportingServiceApi.ScheduleConversationReportRequest.fromPartial({
      context: req?.context,
      conversationId: (reply1?.conversation?.conversationId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<messagingConversationReportingServiceApi.ScheduleConversationReportRequest, messagingConversationReportingServiceApi.ScheduleConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.scheduleConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = messagingChannelReportingServiceApi.DeleteChannelReportRequest.fromPartial({
      channelId: (req?.channelId ?? ""),
      context: req?.context,
      etag: (reply1?.conversation?.audit?.etag ?? ""),
    });
    const reply3 = await this.workQueue.enqueue<messagingChannelReportingServiceApi.DeleteChannelReportRequest, messagingChannelReportingServiceApi.DeleteChannelReportResponse>(
      "acme.messaging.v1.ChannelLifecycleService/ActivateChannel:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      messagingChannelLifecycleServiceApi.ActivateChannelResponse.fromPartial({
        channel: { audit: { createdBy: (reply1?.conversation?.audit?.createdBy ?? "") } },
      }),
      messagingChannelLifecycleServiceApi.ActivateChannelResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      messagingChannelLifecycleServiceApi.ActivateChannelResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      messagingChannelLifecycleServiceApi.ActivateChannelResponse.fromPartial({
        channel: { channelId: (req?.channelId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a channel.
   */
  async expireChannel(req: messagingChannelLifecycleServiceApi.ExpireChannelRequest): Promise<messagingChannelLifecycleServiceApi.ExpireChannelResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireChannel", req);
    this.logger.info("expire_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantReportingServiceApi.ListParticipantReportsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const invoke1: Unary<messagingParticipantReportingServiceApi.ListParticipantReportsRequest, messagingParticipantReportingServiceApi.ListParticipantReportsResponse> =
      (input, done) => this.messagingParticipantReportingClient.listParticipantReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<messagingParticipantReportingServiceApi.ListParticipantReportsRequest, messagingParticipantReportingServiceApi.ListParticipantReportsResponse>(invoke1, request1));
    const request2 = mediaRenditionReportingServiceApi.CountRenditionTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke2: Unary<mediaRenditionReportingServiceApi.CountRenditionTotalsRequest, mediaRenditionReportingServiceApi.CountRenditionTotalsResponse> =
      (input, done) => this.mediaRenditionReportingClient.countRenditionTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<mediaRenditionReportingServiceApi.CountRenditionTotalsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelLifecycleServiceApi.ExpireChannelResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      messagingChannelLifecycleServiceApi.ExpireChannelResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      messagingChannelLifecycleServiceApi.ExpireChannelResponse.fromPartial({
        channel: { channelId: (req?.channelId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a channel.
   */
  async getChannelLifecycle(req: messagingChannelLifecycleServiceApi.GetChannelLifecycleRequest): Promise<messagingChannelLifecycleServiceApi.GetChannelLifecycleResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChannelLifecycle", req);
    this.logger.info("get_channel_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest.fromPartial({
      chatMessage: {
        attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        measurements: [{ observedAt: req?.context?.deadline }],
        source: (req?.context?.tenantId ?? ""),
        subject: { channelId: (req?.channelId ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse> =
      (input, done) => this.messagingChatMessageSyncClient.resolveChatMessageConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      messagingChannelLifecycleServiceApi.GetChannelLifecycleResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      messagingChannelLifecycleServiceApi.GetChannelLifecycleResponse.fromPartial({ channel: { channelId: (req?.channelId ?? "") } }),
    );
  }

  /**
   * Reinstates a channel.
   */
  async reinstateChannel(req: messagingChannelLifecycleServiceApi.ReinstateChannelRequest): Promise<messagingChannelLifecycleServiceApi.ReinstateChannelResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateChannel", req);
    this.logger.info("reinstate_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const invoke1: Unary<mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsRequest, mediaTranscodeJobApprovalServiceApi.ListPendingTranscodeJobsResponse> =
      (input, done) => this.mediaTranscodeJobApprovalClient.listPendingTranscodeJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const method2 = "commentTranscodeJobApproval" as const;
    const invoke2: Unary<mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest, mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse> =
      (input, done) => this.mediaTranscodeJobApprovalClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest, mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelLifecycleServiceApi.ReinstateChannelResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      messagingChannelLifecycleServiceApi.ReinstateChannelResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      messagingChannelLifecycleServiceApi.ReinstateChannelResponse.fromPartial({
        channel: { channelId: (req?.channelId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a channel.
   */
  async renewChannel(req: messagingChannelLifecycleServiceApi.RenewChannelRequest): Promise<messagingChannelLifecycleServiceApi.RenewChannelResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewChannel", req);
    this.logger.info("renew_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantReportingServiceApi.StreamParticipantMetricsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.newOwner?.email ?? ""),
        name: req?.details?.notifyContact?.name,
        phone: (req?.details?.notifyContact?.phone ?? ""),
        preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.messagingParticipantReportingClient.streamParticipantMetrics(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? messagingParticipantReportingServiceApi.StreamParticipantMetricsResponse.fromPartial({});
    const request2 = messagingConversationValidationServiceApi.NormalizeConversationRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notifyContact?.phone ?? "") } },
    });
    const proxy2 = forwarding(this.messagingConversationValidationClient);
    const invoke2: Unary<messagingConversationValidationServiceApi.NormalizeConversationRequest, messagingConversationValidationServiceApi.NormalizeConversationResponse> =
      (input, done) => proxy2.normalizeConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationValidationServiceApi.NormalizeConversationRequest, messagingConversationValidationServiceApi.NormalizeConversationResponse>(invoke2, request2);
    const request3 = messagingParticipantReportingServiceApi.CountParticipantTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.conversation?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply2?.result?.details ?? {}))),
        ownerId: (reply2?.conversation?.conversationId ?? ""),
      },
    });
    const invoke3: Unary<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse> =
      (input, done) => this.messagingParticipantReportingClient.countParticipantTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingParticipantReportingServiceApi.CountParticipantTotalsRequest, messagingParticipantReportingServiceApi.CountParticipantTotalsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelLifecycleServiceApi.RenewChannelResponse.fromPartial({
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      messagingChannelLifecycleServiceApi.RenewChannelResponse.fromPartial({
        outcome: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      messagingChannelLifecycleServiceApi.RenewChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          owner: { userId: (req?.details?.newOwner?.userId ?? "") },
        },
      }),
    );
  }

  /**
   * Schedules a channel.
   */
  async scheduleChannelExpiry(req: messagingChannelLifecycleServiceApi.ScheduleChannelExpiryRequest): Promise<messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ScheduleChannelExpiry", req);
    this.logger.info("schedule_channel_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationReportingServiceApi.ScheduleConversationReportRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<messagingConversationReportingServiceApi.ScheduleConversationReportRequest, messagingConversationReportingServiceApi.ScheduleConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.scheduleConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationReportingServiceApi.ScheduleConversationReportRequest, messagingConversationReportingServiceApi.ScheduleConversationReportResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = messagingChannelReportingServiceApi.ListChannelReportsRequest.fromPartial({
      context: input2?.context,
      filter: {
        createdAfter: input2?.channel?.audit?.createdAt,
        region: ((input2?.channel?.locator?.$case === "address" ? input2?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<messagingChannelReportingServiceApi.ListChannelReportsRequest, messagingChannelReportingServiceApi.ListChannelReportsResponse> =
      (input, done) => this.messagingChannelReportingClient.listChannelReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChannelReportingServiceApi.ListChannelReportsRequest, messagingChannelReportingServiceApi.ListChannelReportsResponse>(invoke2, request2);
    let selected3_1: Array<string> | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.lines ?? []);
        break;
      default:
        selected3_1 = [];
    }
    const request3 = venuesVenueServiceApi.UpdateVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        locator: { $case: "address", address: { lines: (selected3_1 ?? []) } },
        dimensions: { unit: (req?.channel?.dimensions?.unit ?? "") },
      },
    });
    const invoke3: Unary<venuesVenueServiceApi.UpdateVenueRequest, venuesVenueServiceApi.UpdateVenueResponse> =
      (input, done) => this.venuesVenueClient.updateVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<venuesVenueServiceApi.UpdateVenueRequest, venuesVenueServiceApi.UpdateVenueResponse>(invoke3, request3);
    const request4 = webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.details?.notify?.email ?? ""),
          userId: (reply3?.venue?.owner?.userId ?? ""),
        },
      },
      webhookDelivery: {
        measurements: [{ unit: (reply3?.venue?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.channel?.owner?.displayName ?? "") },
      },
    });
    const decoded4 = webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest.toJSON(request4))),
    );
    const invoke4: Unary<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.rejectWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RejectWebhookDeliveryResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse.fromPartial({ outcome: { message: (reply3?.result?.message ?? "") } }),
      messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse.fromPartial({ outcome: { effectiveAt: reply4?.outcome?.effectiveAt } }),
      messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          owner: req?.channel?.owner,
        },
      }),
    );
  }

  /**
   * Suspends a channel.
   */
  async suspendChannel(req: messagingChannelLifecycleServiceApi.SuspendChannelRequest): Promise<messagingChannelLifecycleServiceApi.SuspendChannelResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendChannel", req);
    this.logger.info("suspend_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.ListChatMessageReportsRequest",
      value: Buffer.from(messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest.encode(request1).finish()),
    });
    const unpacked1 = messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest.decode(envelope1.value);
    const invoke1: Unary<messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest, messagingChatMessageReportingServiceApi.ListChatMessageReportsResponse> =
      (input, done) => this.messagingChatMessageReportingClient.listChatMessageReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest, messagingChatMessageReportingServiceApi.ListChatMessageReportsResponse>(invoke1, unpacked1);
    const request2 = identityUserQueryServiceApi.LookupUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.details?.newOwner?.userId ?? ""),
    });
    const client2 = this.clients.get<identityUserQueryServiceApi.UserQueryServiceClient>("acme.identity.v1.UserQueryService");
    const invoke2: Unary<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse> =
      (input, done) => client2.lookupUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelLifecycleServiceApi.SuspendChannelResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingChannelLifecycleServiceApi.SuspendChannelResponse.fromPartial({
        channel: {
          audit: { updatedBy: (reply2?.user?.audit?.updatedBy ?? "") },
          owner: { email: (reply2?.user?.contact?.email ?? "") },
        },
      }),
      messagingChannelLifecycleServiceApi.SuspendChannelResponse.fromPartial({
        channel: { channelId: (req?.channelId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates a channel.
   */
  async terminateChannel(req: messagingChannelLifecycleServiceApi.TerminateChannelRequest): Promise<messagingChannelLifecycleServiceApi.TerminateChannelResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateChannel", req);
    this.logger.info("terminate_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageReportingServiceApi.StreamChatMessageMetricsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.notifyContact?.email ?? ""),
        name: req?.details?.notifyContact?.name,
        phone: (req?.details?.notifyContact?.phone ?? ""),
        preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
      },
    });
    const stream1 = this.messagingChatMessageReportingClient.streamChatMessageMetrics(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? messagingChatMessageReportingServiceApi.StreamChatMessageMetricsResponse.fromPartial({});
    const request2 = messagingParticipantImportServiceApi.ListParticipantImportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke2: Unary<messagingParticipantImportServiceApi.ListParticipantImportsRequest, messagingParticipantImportServiceApi.ListParticipantImportsResponse> =
      (input, done) => this.messagingParticipantImportClient.listParticipantImports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<messagingParticipantImportServiceApi.ListParticipantImportsRequest, messagingParticipantImportServiceApi.ListParticipantImportsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelLifecycleServiceApi.TerminateChannelResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      messagingChannelLifecycleServiceApi.TerminateChannelResponse.fromPartial({
        channel: { channelId: (req?.channelId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChannelLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ChannelLifecycleHandler {
  constructor(@inject(ChannelLifecycleWorkflow) private readonly workflow: ChannelLifecycleWorkflow) {}

  /**
   * Activates a channel.
   */
  activateChannel = unary<messagingChannelLifecycleServiceApi.ActivateChannelRequest, messagingChannelLifecycleServiceApi.ActivateChannelResponse>(
    (request) => this.workflow.activateChannel(request),
  );

  /**
   * Expires a channel.
   */
  expireChannel = unary<messagingChannelLifecycleServiceApi.ExpireChannelRequest, messagingChannelLifecycleServiceApi.ExpireChannelResponse>(
    (request) => this.workflow.expireChannel(request),
  );

  /**
   * Returns a channel.
   */
  getChannelLifecycle = (call: ServerUnaryCall<messagingChannelLifecycleServiceApi.GetChannelLifecycleRequest, messagingChannelLifecycleServiceApi.GetChannelLifecycleResponse>, done: sendUnaryData<messagingChannelLifecycleServiceApi.GetChannelLifecycleResponse>): void => {
    void this.workflow.getChannelLifecycle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates a channel.
   */
  reinstateChannel = unary<messagingChannelLifecycleServiceApi.ReinstateChannelRequest, messagingChannelLifecycleServiceApi.ReinstateChannelResponse>(
    (request) => this.workflow.reinstateChannel(request),
  );

  /**
   * Renews a channel.
   */
  renewChannel = unary<messagingChannelLifecycleServiceApi.RenewChannelRequest, messagingChannelLifecycleServiceApi.RenewChannelResponse>(
    (request) => this.workflow.renewChannel(request),
  );

  /**
   * Schedules a channel.
   */
  scheduleChannelExpiry = (call: ServerUnaryCall<messagingChannelLifecycleServiceApi.ScheduleChannelExpiryRequest, messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse>, done: sendUnaryData<messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse>): void => {
    void this.workflow.scheduleChannelExpiry(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends a channel.
   */
  suspendChannel = unary<messagingChannelLifecycleServiceApi.SuspendChannelRequest, messagingChannelLifecycleServiceApi.SuspendChannelResponse>(
    (request) => this.workflow.suspendChannel(request),
  );

  /**
   * Terminates a channel.
   */
  terminateChannel = unary<messagingChannelLifecycleServiceApi.TerminateChannelRequest, messagingChannelLifecycleServiceApi.TerminateChannelResponse>(
    (request) => this.workflow.terminateChannel(request),
  );
}

export function implementation(handler: ChannelLifecycleHandler): messagingChannelLifecycleServiceApi.ChannelLifecycleServiceServer {
  return {
    activateChannel: handler.activateChannel,
    expireChannel: handler.expireChannel,
    getChannelLifecycle: handler.getChannelLifecycle,
    reinstateChannel: handler.reinstateChannel,
    renewChannel: handler.renewChannel,
    scheduleChannelExpiry: handler.scheduleChannelExpiry,
    suspendChannel: handler.suspendChannel,
    terminateChannel: handler.terminateChannel,
  };
}
