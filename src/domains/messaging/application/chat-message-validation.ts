/**
 * Checks chat messages against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as broadcastsBroadcastQueryServiceApi from "../../../../.cache/proto/acme/broadcasts/v1/broadcast_query_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as messagingChannelCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { GrpcAdapter, call, metadataFor, retry, type RequestPort, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatMessageRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat message operations and persist audit data.
 */
@injectable()
export class ChatMessageValidationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.broadcasts.v1.BroadcastQueryService") private readonly broadcastsBroadcastQueryClient: broadcastsBroadcastQueryServiceApi.BroadcastQueryServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelCalculationService") private readonly messagingChannelCalculationClient: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageCalculationService") private readonly messagingChatMessageCalculationClient: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a chat message.
   */
  async checkChatMessageEligibility(req: messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityRequest): Promise<messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "CheckChatMessageEligibility", req);
    this.logger.info("check_chat_message_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest.fromPartial({
      chatMessage: {
        kind: (req?.chatMessage?.kind ?? ""),
        subject: { code: (req?.chatMessage?.subject?.code ?? "") },
      },
      context: req?.context,
    });
    const invoke1: Unary<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.recalculateChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse>(invoke1, request1);
    const request2 = experimentsVariantCalculationServiceApi.RecalculateVariantsRequest.fromPartial({
      context: req?.context,
      details: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") },
      variant: {
        owner: {
          displayName: (reply1?.chatMessage?.subject?.displayName ?? ""),
          email: (req?.details?.contact?.email ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<experimentsVariantCalculationServiceApi.RecalculateVariantsRequest, experimentsVariantCalculationServiceApi.RecalculateVariantsResponse> =
      (input, done) => this.experimentsVariantCalculationClient.recalculateVariants(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsVariantCalculationServiceApi.RecalculateVariantsRequest, experimentsVariantCalculationServiceApi.RecalculateVariantsResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesRequest.fromPartial({
      context: input3?.context,
      details: {
        contact: {
          email: (reply2?.variant?.owner?.email ?? ""),
          name: input3?.details?.contact?.name,
        },
      },
      metricSeries: {
        audit: { updatedAt: reply2?.variant?.audit?.updatedAt },
        code: (reply1?.chatMessage?.subject?.code ?? ""),
      },
    });
    const invoke3: Unary<metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.validateMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.ValidateMetricSeriesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse.fromPartial({
        chatMessage: {
          sequence: (reply1?.chatMessage?.sequence ?? 0),
          subject: { displayName: (reply1?.chatMessage?.subject?.displayName ?? "") },
        },
      }),
      messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse.fromPartial({
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      messagingChatMessageValidationServiceApi.CheckChatMessageEligibilityResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          source: (req?.chatMessage?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a chat message.
   */
  async explainChatMessageDecision(req: messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest): Promise<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "ExplainChatMessageDecision", req);
    this.logger.info("explain_chat_message_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const cloned1: messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.explainChatMessageCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          source: (req?.chatMessage?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Lints a chat message.
   */
  async lintChatMessages(req: messagingChatMessageValidationServiceApi.LintChatMessagesRequest): Promise<messagingChatMessageValidationServiceApi.LintChatMessagesResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "LintChatMessages", req);
    this.logger.info("lint_chat_messages", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request1 = featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.observedAt,
          labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
          ownerId: (req?.chatMessage?.subject?.channelId ?? ""),
        },
      });
      const invoke1: Unary<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse> =
        (input, done) => this.featureflagsFeatureFlagQueryClient.countFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse.fromPartial({});
    const request2 = messagingConversationCalculationServiceApi.EstimateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: {
          displayName: (req?.chatMessage?.subject?.displayName ?? ""),
          email: (req?.details?.contact?.email ?? ""),
        },
        requester: { name: req?.details?.contact?.name },
      },
    });
    const decoded2 = messagingConversationCalculationServiceApi.EstimateConversationRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingConversationCalculationServiceApi.EstimateConversationRequest.toJSON(request2))),
    );
    const invoke2: Unary<messagingConversationCalculationServiceApi.EstimateConversationRequest, messagingConversationCalculationServiceApi.EstimateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.estimateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationCalculationServiceApi.EstimateConversationRequest, messagingConversationCalculationServiceApi.EstimateConversationResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageValidationServiceApi.LintChatMessagesResponse.fromPartial({
        chatMessage: { correlationId: (reply2?.result?.correlationId ?? "") },
        outcome: { status: (reply2?.result?.status ?? "") },
      }),
      messagingChatMessageValidationServiceApi.LintChatMessagesResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          kind: (req?.chatMessage?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a chat message.
   */
  async previewChatMessage(req: messagingChatMessageValidationServiceApi.PreviewChatMessageRequest): Promise<messagingChatMessageValidationServiceApi.PreviewChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "PreviewChatMessage", req);
    this.logger.info("preview_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = broadcastsBroadcastQueryServiceApi.ResolveBroadcastsRequest.fromPartial({ context: req?.context });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.broadcasts.v1.ResolveBroadcastsRequest",
      value: Buffer.from(broadcastsBroadcastQueryServiceApi.ResolveBroadcastsRequest.encode(request1).finish()),
    });
    const unpacked1 = broadcastsBroadcastQueryServiceApi.ResolveBroadcastsRequest.decode(envelope1.value);
    const invoke1: Unary<broadcastsBroadcastQueryServiceApi.ResolveBroadcastsRequest, broadcastsBroadcastQueryServiceApi.ResolveBroadcastsResponse> =
      (input, done) => this.broadcastsBroadcastQueryClient.resolveBroadcasts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<broadcastsBroadcastQueryServiceApi.ResolveBroadcastsRequest, broadcastsBroadcastQueryServiceApi.ResolveBroadcastsResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageValidationServiceApi.PreviewChatMessageResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      messagingChatMessageValidationServiceApi.PreviewChatMessageResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          sequence: (req?.chatMessage?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Scores a chat message.
   */
  async scoreChatMessage(req: messagingChatMessageValidationServiceApi.ScoreChatMessageRequest): Promise<messagingChatMessageValidationServiceApi.ScoreChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "ScoreChatMessage", req);
    this.logger.info("score_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationValidationServiceApi.NormalizeConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        origin: { $case: "customer", customer: {
          code: (req?.chatMessage?.subject?.code ?? ""),
          displayName: (req?.chatMessage?.subject?.displayName ?? ""),
        } },
      },
    });
    const client1 = this.clients.get<messagingConversationValidationServiceApi.ConversationValidationServiceClient>("acme.messaging.v1.ConversationValidationService");
    const invoke1: Unary<messagingConversationValidationServiceApi.NormalizeConversationRequest, messagingConversationValidationServiceApi.NormalizeConversationResponse> =
      (input, done) => client1.normalizeConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationValidationServiceApi.NormalizeConversationRequest, messagingConversationValidationServiceApi.NormalizeConversationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageValidationServiceApi.ScoreChatMessageResponse.fromPartial({
        chatMessage: {
          subject: {
            displayName: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
      }),
      messagingChatMessageValidationServiceApi.ScoreChatMessageResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          occurredAt: req?.chatMessage?.occurredAt,
        },
      }),
    );
  }

  /**
   * Validates a chat message.
   */
  async validateChatMessage(req: messagingChatMessageValidationServiceApi.ValidateChatMessageRequest): Promise<messagingChatMessageValidationServiceApi.ValidateChatMessageResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "ValidateChatMessage", req);
    this.logger.info("validate_chat_message", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelCalculationServiceApi.CalculateChannelRequest.fromPartial({
      channel: {
        owner: {
          displayName: (req?.chatMessage?.subject?.displayName ?? ""),
          email: (req?.details?.contact?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelCalculationServiceApi.CalculateChannelRequest, messagingChannelCalculationServiceApi.CalculateChannelResponse> =
      (input, done) => this.messagingChannelCalculationClient.calculateChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<messagingChannelCalculationServiceApi.CalculateChannelRequest, messagingChannelCalculationServiceApi.CalculateChannelResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = messagingConversationValidationServiceApi.ScoreConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { displayName: (req?.chatMessage?.subject?.displayName ?? "") },
        requester: { phone: (req?.details?.contact?.phone ?? "") },
      },
    });
    const invoke2: Unary<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse> =
      (input, done) => this.messagingConversationValidationClient.scoreConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<messagingConversationValidationServiceApi.ScoreConversationRequest, messagingConversationValidationServiceApi.ScoreConversationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageValidationServiceApi.ValidateChatMessageResponse.fromPartial({
        chatMessage: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingChatMessageValidationServiceApi.ValidateChatMessageResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      messagingChatMessageValidationServiceApi.ValidateChatMessageResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          occurredAt: req?.chatMessage?.occurredAt,
        },
      }),
    );
  }
}
