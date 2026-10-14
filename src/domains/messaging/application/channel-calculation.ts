/**
 * Computes the figures of a channel, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as webhooksWebhookEndpointValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
} from "../../../platform/rpc.js";
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
export class ChannelCalculationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageCalculationService") private readonly messagingChatMessageCalculationClient: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointValidationService") private readonly webhooksWebhookEndpointValidationClient: webhooksWebhookEndpointValidationServiceApi.WebhookEndpointValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a channel.
   */
  async calculateChannel(req: messagingChannelCalculationServiceApi.CalculateChannelRequest): Promise<messagingChannelCalculationServiceApi.CalculateChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "CalculateChannel", req);
    this.logger.info("calculate_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        locator: { $case: "address", address: {
          countryCode: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.countryCode ?? ""),
        } },
      },
    });
    const invoke1: Unary<webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionRequest, webhooksWebhookEndpointValidationServiceApi.ExplainWebhookEndpointDecisionResponse> =
      (input, done) => this.webhooksWebhookEndpointValidationClient.explainWebhookEndpointDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelCalculationServiceApi.CalculateChannelResponse.fromPartial({
        channel: {
          components: { primary: {
            quantity: (reply1?.webhookEndpoint?.components?.["primary"]?.quantity ?? 0),
          } },
        },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      messagingChannelCalculationServiceApi.CalculateChannelResponse.fromPartial({
        channel: {
          capacity: (req?.channel?.capacity ?? 0),
          channelId: (req?.channelId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a channel.
   */
  async compareChannelOptions(req: messagingChannelCalculationServiceApi.CompareChannelOptionsRequest): Promise<messagingChannelCalculationServiceApi.CompareChannelOptionsResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "CompareChannelOptions", req);
    this.logger.info("compare_channel_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest.fromPartial({
      chatMessage: {
        measurements: [{ unit: (req?.channel?.dimensions?.unit ?? "") }],
        subject: { channelId: (req?.channel?.channelId ?? "") },
      },
      context: req?.context,
      details: {
        destination: {
          postalCode: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.postalCode ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse>(
      "acme.messaging.v1.ChannelCalculationService/CompareChannelOptions:0", request1,
    );
    const request2 = mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest, mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetClient.batchGetMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest, mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelCalculationServiceApi.CompareChannelOptionsResponse.fromPartial({
        channel: { code: (reply1?.chatMessage?.subject?.code ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      messagingChannelCalculationServiceApi.CompareChannelOptionsResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      messagingChannelCalculationServiceApi.CompareChannelOptionsResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          name: (req?.channel?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a channel.
   */
  async estimateChannel(req: messagingChannelCalculationServiceApi.EstimateChannelRequest): Promise<messagingChannelCalculationServiceApi.EstimateChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "EstimateChannel", req);
    this.logger.info("estimate_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.PreviewConversationRequest.fromPartial({
      context: req?.context,
      conversation: { audit: { etag: (req?.channel?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<messagingConversationValidationServiceApi.PreviewConversationRequest, messagingConversationValidationServiceApi.PreviewConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.previewConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<messagingConversationValidationServiceApi.PreviewConversationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelCalculationServiceApi.EstimateChannelResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      messagingChannelCalculationServiceApi.EstimateChannelResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        channel: { channelId: (req?.channelId ?? "") },
      }),
    );
  }

  /**
   * Explains a channel.
   */
  async explainChannelCalculation(req: messagingChannelCalculationServiceApi.ExplainChannelCalculationRequest): Promise<messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ExplainChannelCalculation", req);
    this.logger.info("explain_channel_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest, messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.calculateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = messagingConversationValidationServiceApi.LintConversationsRequest.fromPartial({
      context: req?.context,
      conversation: { audit: { updatedAt: req?.channel?.audit?.updatedAt } },
    });
    const invoke2: Unary<messagingConversationValidationServiceApi.LintConversationsRequest, messagingConversationValidationServiceApi.LintConversationsResponse> =
      (input, done) => this.messagingConversationValidationClient.lintConversations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = messagingConversationCalculationServiceApi.EstimateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        audit: { updatedBy: (reply2?.conversation?.audit?.updatedBy ?? "") },
        sla: { dueAt: reply2?.conversation?.sla?.dueAt },
      },
      details: {
        destination: {
          region: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.region ?? ""),
        },
      },
    });
    const method3 = "estimateConversation" as const;
    const invoke3: Unary<messagingConversationCalculationServiceApi.EstimateConversationRequest, messagingConversationCalculationServiceApi.EstimateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingConversationCalculationServiceApi.EstimateConversationRequest, messagingConversationCalculationServiceApi.EstimateConversationResponse>(invoke3, request3);
    const request4 = messagingConversationValidationServiceApi.ExplainConversationDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
    });
    const proxy4 = forwarding(this.messagingConversationValidationClient);
    const invoke4: Unary<messagingConversationValidationServiceApi.ExplainConversationDecisionRequest, messagingConversationValidationServiceApi.ExplainConversationDecisionResponse> =
      (input, done) => proxy4.explainConversationDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingConversationValidationServiceApi.ExplainConversationDecisionRequest, messagingConversationValidationServiceApi.ExplainConversationDecisionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse.fromPartial({
        channel: {
          owner: { displayName: (reply1?.chatMessage?.subject?.displayName ?? "") },
        },
      }),
      messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse.fromPartial({
        channel: { owner: { email: (reply2?.conversation?.requester?.email ?? "") } },
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
      }),
      messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse.fromPartial({
        channel: { audit: { createdAt: reply3?.conversation?.audit?.createdAt } },
      }),
      messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse.fromPartial({
        channel: {
          audit: { etag: (reply4?.conversation?.audit?.etag ?? "") },
          owner: { email: (reply4?.conversation?.assignee?.email ?? "") },
        },
      }),
      messagingChannelCalculationServiceApi.ExplainChannelCalculationResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          code: (req?.channel?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a channel.
   */
  async getChannelRates(req: messagingChannelCalculationServiceApi.GetChannelRatesRequest): Promise<messagingChannelCalculationServiceApi.GetChannelRatesResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChannelRates", req);
    this.logger.info("get_channel_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      notificationTemplate: { audit: { updatedAt: req?.context?.deadline } },
    });
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.explainNotificationTemplateCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse>(invoke1, request1);
    return mergeResponses(
      messagingChannelCalculationServiceApi.GetChannelRatesResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      messagingChannelCalculationServiceApi.GetChannelRatesResponse.fromPartial({ channel: { channelId: (req?.channelId ?? "") } }),
    );
  }

  /**
   * Quotes a channel.
   */
  async quoteChannel(req: messagingChannelCalculationServiceApi.QuoteChannelRequest): Promise<messagingChannelCalculationServiceApi.QuoteChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "QuoteChannel", req);
    this.logger.info("quote_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.NormalizePostRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.channel?.owner?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse> =
      (input, done) => this.communityPostValidationClient.normalizePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = messagingConversationValidationServiceApi.ScoreConversationRequest.fromPartial({
      context: input2?.context,
      details: {
        destination: { recipient: (reply1?.post?.billingAddress?.recipient ?? "") },
      },
    });
    const invoke2: Unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.scoreConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelCalculationServiceApi.QuoteChannelResponse.fromPartial({
        channel: { audit: { updatedBy: (reply1?.post?.audit?.updatedBy ?? "") } },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      messagingChannelCalculationServiceApi.QuoteChannelResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      messagingChannelCalculationServiceApi.QuoteChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          code: (req?.channel?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a channel.
   */
  async recalculateChannels(req: messagingChannelCalculationServiceApi.RecalculateChannelsRequest): Promise<messagingChannelCalculationServiceApi.RecalculateChannelsResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "RecalculateChannels", req);
    this.logger.info("recalculate_channels", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (req?.channel?.owner?.displayName ?? "") },
        audit: { etag: (req?.channel?.audit?.etag ?? "") },
        comments: [{ createdAt: req?.channel?.audit?.createdAt }],
        requester: { email: (req?.channel?.owner?.email ?? "") },
      },
    });
    const cloned1: notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest, notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.recordNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationHistoryServiceApi.RecordNotificationVersionRequest, notificationsNotificationHistoryServiceApi.RecordNotificationVersionResponse>(invoke1, cloned1);
    const request2 = messagingConversationCalculationServiceApi.CalculateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { email: (req?.channel?.owner?.email ?? "") },
        audit: { updatedBy: (reply1?.notification?.audit?.updatedBy ?? "") },
        sla: { pausedFor: reply1?.notification?.sla?.pausedFor },
      },
      details: {
        destination: {
          postalCode: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.postalCode ?? ""),
        },
      },
    });
    const decoded2 = messagingConversationCalculationServiceApi.CalculateConversationRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingConversationCalculationServiceApi.CalculateConversationRequest.toJSON(request2))),
    );
    const invoke2: Unary<messagingConversationCalculationServiceApi.CalculateConversationRequest, messagingConversationCalculationServiceApi.CalculateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.calculateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationCalculationServiceApi.CalculateConversationRequest, messagingConversationCalculationServiceApi.CalculateConversationResponse>(invoke2, decoded2);
    const request3 = messagingConversationValidationServiceApi.PreviewConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { displayName: (reply2?.conversation?.assignee?.displayName ?? "") },
        audit: { updatedBy: (reply1?.notification?.audit?.updatedBy ?? "") },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.PreviewConversationRequest",
      value: Buffer.from(messagingConversationValidationServiceApi.PreviewConversationRequest.encode(request3).finish()),
    });
    const unpacked3 = messagingConversationValidationServiceApi.PreviewConversationRequest.decode(envelope3.value);
    const invoke3: Unary<messagingConversationValidationServiceApi.PreviewConversationRequest, messagingConversationValidationServiceApi.PreviewConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.previewConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingConversationValidationServiceApi.PreviewConversationRequest, messagingConversationValidationServiceApi.PreviewConversationResponse>(invoke3, unpacked3);
    const request4 = messagingConversationValidationServiceApi.ScoreConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        requester: { email: (reply1?.notification?.requester?.email ?? "") },
        sla: { breached: (reply3?.conversation?.sla?.breached ?? false) },
      },
    });
    const client4 = this.clients.get<messagingConversationValidationServiceApi.ConversationValidationServiceClient>("acme.messaging.v1.ConversationValidationService");
    const invoke4: Unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> =
      (input, done) => client4.scoreConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelCalculationServiceApi.RecalculateChannelsResponse.fromPartial({
        channel: {
          audit: { createdAt: reply1?.notification?.audit?.createdAt },
          owner: {
            displayName: ((reply1?.notification?.origin?.$case === "customer" ? reply1?.notification?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
      }),
      messagingChannelCalculationServiceApi.RecalculateChannelsResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingChannelCalculationServiceApi.RecalculateChannelsResponse.fromPartial({
        channel: { audit: { updatedAt: reply3?.conversation?.audit?.updatedAt } },
      }),
      messagingChannelCalculationServiceApi.RecalculateChannelsResponse.fromPartial({
        breakdown: { currencyCode: (reply4?.breakdown?.currencyCode ?? "") },
        result: { details: (reply4?.result?.details ?? {}) },
      }),
      messagingChannelCalculationServiceApi.RecalculateChannelsResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          name: (req?.channel?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a channel.
   */
  async simulateChannel(req: messagingChannelCalculationServiceApi.SimulateChannelRequest): Promise<messagingChannelCalculationServiceApi.SimulateChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "SimulateChannel", req);
    this.logger.info("simulate_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.ExplainConversationDecisionRequest.fromPartial({
      context: req?.context,
      conversation: {
        audit: {
          createdBy: (req?.channel?.audit?.createdBy ?? ""),
          etag: (req?.channel?.audit?.etag ?? ""),
        },
      },
    });
    const invoke1: Unary<messagingConversationValidationServiceApi.ExplainConversationDecisionRequest, messagingConversationValidationServiceApi.ExplainConversationDecisionResponse> =
      (input, done) => this.messagingConversationValidationClient.explainConversationDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<messagingConversationValidationServiceApi.ExplainConversationDecisionRequest, messagingConversationValidationServiceApi.ExplainConversationDecisionResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = messagingConversationValidationServiceApi.ScoreConversationRequest.fromPartial({
      context: req?.context,
      conversation: { audit: { createdBy: (reply1?.conversation?.audit?.createdBy ?? "") } },
      details: {
        destination: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
    });
    const invoke2: Unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.scoreConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelCalculationServiceApi.SimulateChannelResponse.fromPartial({
        channel: { audit: { createdAt: reply1?.conversation?.audit?.createdAt } },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      messagingChannelCalculationServiceApi.SimulateChannelResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      messagingChannelCalculationServiceApi.SimulateChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          owner: req?.channel?.owner,
        },
      }),
    );
  }
}
