/**
 * Runs the long-lived workflow that takes a channel from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as chatChatBotReportingServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as chatChatRoomServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatChatRoomWorkflowServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as fuelFuelCardQueryServiceApi from "../../../../../.cache/proto/acme/fuel/v1/fuel_card_query_service.js";
import * as messagingChannelApprovalServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_approval_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import * as messagingChannelWorkflowServiceApi from "../../../../../.cache/proto/acme/messaging/v1/channel_workflow_service.js";
import * as messagingConversationReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingParticipantApprovalServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_approval_service.js";
import * as messagingParticipantLifecycleServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_lifecycle_service.js";
import * as messagingParticipantReportingServiceApi from "../../../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../../platform/rpc.js";
import { collect, upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toChannelRecord } from "../../data/records.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate channel operations and persist audit data.
 */
@injectable()
export class ChannelWorkflowWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotReportingService") private readonly chatChatBotReportingClient: chatChatBotReportingServiceApi.ChatBotReportingServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomWorkflowService") private readonly chatChatRoomWorkflowClient: chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.fuel.v1.FuelCardQueryService") private readonly fuelFuelCardQueryClient: fuelFuelCardQueryServiceApi.FuelCardQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelApprovalService") private readonly messagingChannelApprovalClient: messagingChannelApprovalServiceApi.ChannelApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelLifecycleService") private readonly messagingChannelLifecycleClient: messagingChannelLifecycleServiceApi.ChannelLifecycleServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantApprovalService") private readonly messagingParticipantApprovalClient: messagingParticipantApprovalServiceApi.ParticipantApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantLifecycleService") private readonly messagingParticipantLifecycleClient: messagingParticipantLifecycleServiceApi.ParticipantLifecycleServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantReportingService") private readonly messagingParticipantReportingClient: messagingParticipantReportingServiceApi.ParticipantReportingServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryApprovalService") private readonly webhooksWebhookDeliveryApprovalClient: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a channel.
   */
  async advanceChannelWorkflow(req: messagingChannelWorkflowServiceApi.AdvanceChannelWorkflowRequest): Promise<messagingChannelWorkflowServiceApi.AdvanceChannelWorkflowResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "AdvanceChannelWorkflow", req);
    this.logger.info("advance_channel_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fuelFuelCardQueryServiceApi.ExportFuelCardsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.channel?.audit?.createdAt,
        region: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const stream1 = this.fuelFuelCardQueryClient.exportFuelCards(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? fuelFuelCardQueryServiceApi.ExportFuelCardsResponse.fromPartial({});
    const request2 = webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesRequest, webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.listPendingWebhookDeliveries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<webhooksWebhookDeliveryApprovalServiceApi.ListPendingWebhookDeliveriesResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = chatChatRoomWorkflowServiceApi.ListChatRoomWorkflowsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.channel?.audit?.updatedAt,
        ownerId: (req?.channel?.components?.["primary"]?.componentId ?? ""),
        region: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke3: Unary<chatChatRoomWorkflowServiceApi.ListChatRoomWorkflowsRequest, chatChatRoomWorkflowServiceApi.ListChatRoomWorkflowsResponse> =
      (input, done) => this.chatChatRoomWorkflowClient.listChatRoomWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelWorkflowServiceApi.AdvanceChannelWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      messagingChannelWorkflowServiceApi.AdvanceChannelWorkflowResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      messagingChannelWorkflowServiceApi.AdvanceChannelWorkflowResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          specs: (req?.channel?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Cancels a channel.
   */
  async cancelChannelWorkflow(req: messagingChannelWorkflowServiceApi.CancelChannelWorkflowRequest): Promise<messagingChannelWorkflowServiceApi.CancelChannelWorkflowResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "CancelChannelWorkflow", req);
    this.logger.info("cancel_channel_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = authorizationAccessPolicyValidationServiceApi.LintAccessPoliciesRequest.fromPartial({
      accessPolicy: {
        owner: {
          email: (req?.details?.notify?.email ?? ""),
          userId: (req?.channel?.owner?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { contact: { name: req?.details?.notify?.name } },
    });
    const invoke1: Unary<authorizationAccessPolicyValidationServiceApi.LintAccessPoliciesRequest, authorizationAccessPolicyValidationServiceApi.LintAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.lintAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = chatChatBotReportingServiceApi.ScheduleChatBotReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.channel?.specs ?? {}))),
        period: reply1?.accessPolicy?.effective,
      },
      reason: ((reply1?.accessPolicy?.action?.$case === "block" ? reply1?.accessPolicy?.action.block : undefined)?.reason ?? ""),
    });
    const method2 = "scheduleChatBotReport" as const;
    const invoke2: Unary<chatChatBotReportingServiceApi.ScheduleChatBotReportRequest, chatChatBotReportingServiceApi.ScheduleChatBotReportResponse> =
      (input, done) => this.chatChatBotReportingClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatBotReportingServiceApi.ScheduleChatBotReportRequest, chatChatBotReportingServiceApi.ScheduleChatBotReportResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelWorkflowServiceApi.CancelChannelWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      messagingChannelWorkflowServiceApi.CancelChannelWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      messagingChannelWorkflowServiceApi.CancelChannelWorkflowResponse.fromPartial({
        channel: {
          capacity: (req?.channel?.capacity ?? 0),
          channelId: (req?.channelId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a channel.
   */
  async inspectChannelWorkflow(req: messagingChannelWorkflowServiceApi.InspectChannelWorkflowRequest): Promise<messagingChannelWorkflowServiceApi.InspectChannelWorkflowResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectChannelWorkflow", req);
    this.logger.info("inspect_channel_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowRequest.fromPartial({
      chatRoom: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy1 = forwarding(this.chatChatRoomWorkflowClient);
    const invoke1: Unary<chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowResponse> =
      (input, done) => proxy1.signalChatRoomWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.SignalChatRoomWorkflowResponse>(invoke1, request1);
    return mergeResponses(
      messagingChannelWorkflowServiceApi.InspectChannelWorkflowResponse.fromPartial({
        channel: {
          categoryPath: (reply1?.chatRoom?.categoryPath ?? []),
          dimensions: { unit: (reply1?.chatRoom?.dimensions?.unit ?? "") },
        },
      }),
      messagingChannelWorkflowServiceApi.InspectChannelWorkflowResponse.fromPartial({ channel: { channelId: (req?.channelId ?? "") } }),
    );
  }

  /**
   * Lists channels a page at a time.
   */
  async listChannelWorkflows(req: messagingChannelWorkflowServiceApi.ListChannelWorkflowsRequest): Promise<messagingChannelWorkflowServiceApi.ListChannelWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChannelWorkflows", req);
    this.logger.info("list_channel_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantReportingServiceApi.ShareParticipantReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: {
        recipient: { email: (req?.context?.actor?.email ?? "") },
        variables: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
      participantId: (req?.filter?.ownerId ?? ""),
    });
    const invoke1: Unary<messagingParticipantReportingServiceApi.ShareParticipantReportRequest, messagingParticipantReportingServiceApi.ShareParticipantReportResponse> =
      (input, done) => this.messagingParticipantReportingClient.shareParticipantReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingParticipantReportingServiceApi.ShareParticipantReportRequest, messagingParticipantReportingServiceApi.ShareParticipantReportResponse>(invoke1, request1);
    const request2 = experimentsExposureReportingServiceApi.StreamExposureMetricsRequest.fromPartial({
      context: req?.context,
      subscriber: {
        preferredChannel: (reply1?.participant?.contact?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.experimentsExposureReportingClient.streamExposureMetrics(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? experimentsExposureReportingServiceApi.StreamExposureMetricsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChannelWorkflowServiceApi.ListChannelWorkflowsResponse.fromPartial({
      channels: [{
        owner: { userId: (reply1?.participant?.relationshipManager?.userId ?? "") },
      }],
    });
  }

  /**
   * Resumes a channel.
   */
  async resumeChannelWorkflow(req: messagingChannelWorkflowServiceApi.ResumeChannelWorkflowRequest): Promise<messagingChannelWorkflowServiceApi.ResumeChannelWorkflowResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ResumeChannelWorkflow", req);
    this.logger.info("resume_channel_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        dimensions: { unit: (req?.channel?.dimensions?.unit ?? "") },
        owner: { displayName: (req?.channel?.owner?.displayName ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest, searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityResponse> =
      (input, done) => this.searchSearchIndexValidationClient.checkSearchIndexEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityRequest, searchSearchIndexValidationServiceApi.CheckSearchIndexEligibilityResponse>(invoke1, spread1);
    const request2 = chatChatRoomServiceApi.BatchCreateChatRoomsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.channel?.channelId ?? ""),
        submittedBy: req?.details?.notify,
      } },
    });
    const reply2 = await upload<chatChatRoomServiceApi.BatchCreateChatRoomsRequest, chatChatRoomServiceApi.BatchCreateChatRoomsResponse>(
      (done) => this.chatChatRoomClient.batchCreateChatRooms(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelWorkflowServiceApi.ResumeChannelWorkflowResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      messagingChannelWorkflowServiceApi.ResumeChannelWorkflowResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          code: (req?.channel?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a channel.
   */
  async signalChannelWorkflow(req: messagingChannelWorkflowServiceApi.SignalChannelWorkflowRequest): Promise<messagingChannelWorkflowServiceApi.SignalChannelWorkflowResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "SignalChannelWorkflow", req);
    this.logger.info("signal_channel_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = messagingChannelApprovalServiceApi.GetChannelApprovalStatusRequest.fromPartial({
      channelId: (input1?.channel?.channelId ?? ""),
      context: input1?.context,
    });
    const invoke1: Unary<messagingChannelApprovalServiceApi.GetChannelApprovalStatusRequest, messagingChannelApprovalServiceApi.GetChannelApprovalStatusResponse> =
      (input, done) => this.messagingChannelApprovalClient.getChannelApprovalStatus(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChannelApprovalServiceApi.GetChannelApprovalStatusRequest, messagingChannelApprovalServiceApi.GetChannelApprovalStatusResponse>(invoke1, request1);
    const request2 = messagingConversationReportingServiceApi.ScheduleConversationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const cloned2: messagingConversationReportingServiceApi.ScheduleConversationReportRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<messagingConversationReportingServiceApi.ScheduleConversationReportRequest, messagingConversationReportingServiceApi.ScheduleConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.scheduleConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationReportingServiceApi.ScheduleConversationReportRequest, messagingConversationReportingServiceApi.ScheduleConversationReportResponse>(invoke2, cloned2);
    const request3 = messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.channel?.owner?.userId ?? "") } },
      participant: {
        primaryAddress: {
          countryCode: ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.countryCode ?? ""),
          lines: ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.lines ?? []).map((value) => value),
        },
        relationshipManager: { email: (reply1?.channel?.owner?.email ?? "") },
      },
    });
    const decoded3 = messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest.toJSON(request3))),
    );
    const invoke3: Unary<messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest, messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse> =
      (input, done) => this.messagingParticipantApprovalClient.commentParticipantApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingParticipantApprovalServiceApi.CommentParticipantApprovalRequest, messagingParticipantApprovalServiceApi.CommentParticipantApprovalResponse>(invoke3, decoded3);
    const request4 = messagingChannelLifecycleServiceApi.TerminateChannelRequest.fromPartial({
      channelId: (req?.channel?.channelId ?? ""),
      context: req?.context,
      details: {
        notifyContact: {
          email: (reply1?.channel?.owner?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const envelope4 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.TerminateChannelRequest",
      value: Buffer.from(messagingChannelLifecycleServiceApi.TerminateChannelRequest.encode(request4).finish()),
    });
    const unpacked4 = messagingChannelLifecycleServiceApi.TerminateChannelRequest.decode(envelope4.value);
    const invoke4: Unary<messagingChannelLifecycleServiceApi.TerminateChannelRequest, messagingChannelLifecycleServiceApi.TerminateChannelResponse> =
      (input, done) => this.messagingChannelLifecycleClient.terminateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingChannelLifecycleServiceApi.TerminateChannelRequest, messagingChannelLifecycleServiceApi.TerminateChannelResponse>(invoke4, unpacked4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelWorkflowServiceApi.SignalChannelWorkflowResponse.fromPartial({
        channel: {
          dimensions: { unit: (reply1?.channel?.dimensions?.unit ?? "") },
          owner: { userId: (reply1?.channel?.owner?.userId ?? "") },
        },
      }),
      messagingChannelWorkflowServiceApi.SignalChannelWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      messagingChannelWorkflowServiceApi.SignalChannelWorkflowResponse.fromPartial({ outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) } }),
      messagingChannelWorkflowServiceApi.SignalChannelWorkflowResponse.fromPartial({
        outcome: {
          effectiveAt: reply4?.outcome?.effectiveAt,
          message: (reply4?.result?.message ?? ""),
        },
      }),
      messagingChannelWorkflowServiceApi.SignalChannelWorkflowResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          code: (req?.channel?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a channel.
   */
  async startChannelWorkflow(req: messagingChannelWorkflowServiceApi.StartChannelWorkflowRequest): Promise<messagingChannelWorkflowServiceApi.StartChannelWorkflowResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "StartChannelWorkflow", req);
    this.logger.info("start_channel_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected1_2 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_3: string | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected1_3 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryRequest.fromPartial({
      context: req?.context,
      participant: {
        audit: { createdAt: req?.channel?.audit?.createdAt },
        primaryAddress: {
          locality: (selected1_2 ?? ""),
          region: (selected1_3 ?? ""),
        },
        relationshipManager: { email: (req?.channel?.owner?.email ?? "") },
      },
    });
    const invoke1: Unary<messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryRequest, messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryResponse> =
      (input, done) => this.messagingParticipantLifecycleClient.scheduleParticipantExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryRequest, messagingParticipantLifecycleServiceApi.ScheduleParticipantExpiryResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelWorkflowServiceApi.StartChannelWorkflowResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      messagingChannelWorkflowServiceApi.StartChannelWorkflowResponse.fromPartial({
        channel: {
          capacity: (req?.channel?.capacity ?? 0),
          channelId: (req?.channelId ?? ""),
        },
      }),
    );
  }
}
