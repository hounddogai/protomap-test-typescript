/**
 * Checks channels against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as contentContentBlockCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as messagingChannelValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
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
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChannelRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate channel operations and persist audit data.
 */
@injectable()
export class ChannelValidationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageValidationService") private readonly messagingChatMessageValidationClient: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantCalculationService") private readonly messagingParticipantCalculationClient: messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a channel.
   */
  async checkChannelEligibility(req: messagingChannelValidationServiceApi.CheckChannelEligibilityRequest): Promise<messagingChannelValidationServiceApi.CheckChannelEligibilityResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "CheckChannelEligibility", req);
    this.logger.info("check_channel_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
    });
    const proxy1 = forwarding(this.messagingChatMessageValidationClient);
    const invoke1: Unary<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse> =
      (input, done) => proxy1.explainChatMessageDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionRequest, messagingChatMessageValidationServiceApi.ExplainChatMessageDecisionResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_4: string | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected2_4 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected2_4 = "";
    }
    const request2 = messagingConversationCalculationServiceApi.SimulateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { displayName: (req?.channel?.owner?.displayName ?? "") },
        audit: { createdBy: (req?.channel?.audit?.createdBy ?? "") },
      },
      details: {
        destination: {
          countryCode: (selected2_1 ?? ""),
          postalCode: (selected2_4 ?? ""),
        },
      },
    });
    const invoke2: Unary<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.simulateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationCalculationServiceApi.SimulateConversationRequest, messagingConversationCalculationServiceApi.SimulateConversationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelValidationServiceApi.CheckChannelEligibilityResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      messagingChannelValidationServiceApi.CheckChannelEligibilityResponse.fromPartial({
        channel: {
          audit: { createdBy: (reply2?.conversation?.audit?.createdBy ?? "") },
          code: ((reply2?.conversation?.origin?.$case === "customer" ? reply2?.conversation?.origin.customer : undefined)?.code ?? ""),
        },
      }),
      messagingChannelValidationServiceApi.CheckChannelEligibilityResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          name: (req?.channel?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a channel.
   */
  async explainChannelDecision(req: messagingChannelValidationServiceApi.ExplainChannelDecisionRequest): Promise<messagingChannelValidationServiceApi.ExplainChannelDecisionResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ExplainChannelDecision", req);
    this.logger.info("explain_channel_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{ manager: { displayName: (req?.channel?.owner?.displayName ?? "") } }],
        }],
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.estimateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = messagingParticipantCalculationServiceApi.SimulateParticipantRequest.fromPartial({
      context: input2?.context,
      participant: {
        audit: { updatedBy: (input2?.channel?.audit?.updatedBy ?? "") },
        primaryAddress: { locality: (reply1?.contentBlock?.location?.locality ?? "") },
        relationshipManager: { userId: (reply1?.contentBlock?.manager?.userId ?? "") },
      },
    });
    const invoke2: Unary<messagingParticipantCalculationServiceApi.SimulateParticipantRequest, messagingParticipantCalculationServiceApi.SimulateParticipantResponse> =
      (input, done) => this.messagingParticipantCalculationClient.simulateParticipant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingParticipantCalculationServiceApi.SimulateParticipantRequest, messagingParticipantCalculationServiceApi.SimulateParticipantResponse>(invoke2, request2);
    const request3 = notificationsNotificationNotificationServiceApi.StreamNotificationNoticesRequest.fromPartial({
      context: req?.context,
      subscriber: { email: (req?.details?.contact?.email ?? "") },
    });
    const stream3 = this.notificationsNotificationNotificationClient.streamNotificationNotices(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? notificationsNotificationNotificationServiceApi.StreamNotificationNoticesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelValidationServiceApi.ExplainChannelDecisionResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      messagingChannelValidationServiceApi.ExplainChannelDecisionResponse.fromPartial({
        channel: { audit: { etag: (reply2?.participant?.audit?.etag ?? "") } },
      }),
      messagingChannelValidationServiceApi.ExplainChannelDecisionResponse.fromPartial({
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
  async getChannelRules(req: messagingChannelValidationServiceApi.GetChannelRulesRequest): Promise<messagingChannelValidationServiceApi.GetChannelRulesResponse> {
    validateContext(req.context);
    if (!req.channelId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "channel_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChannelRules", req);
    this.logger.info("get_channel_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingParticipantCalculationServiceApi.QuoteParticipantRequest.fromPartial({
      context: req?.context,
      participant: {
        participantId: (req?.channelId ?? ""),
        relationshipManager: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const cloned1: messagingParticipantCalculationServiceApi.QuoteParticipantRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<messagingParticipantCalculationServiceApi.QuoteParticipantRequest, messagingParticipantCalculationServiceApi.QuoteParticipantResponse> =
      (input, done) => this.messagingParticipantCalculationClient.quoteParticipant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingParticipantCalculationServiceApi.QuoteParticipantRequest, messagingParticipantCalculationServiceApi.QuoteParticipantResponse>(invoke1, cloned1);
    const request2 = metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.participant?.primaryAddress?.region ?? "") },
    });
    const decoded2 = metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromJSON(
      JSON.parse(JSON.stringify(metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.toJSON(request2))),
    );
    const invoke2: Unary<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.browseMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse>(invoke2, decoded2);
    return mergeResponses(
      messagingChannelValidationServiceApi.GetChannelRulesResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      messagingChannelValidationServiceApi.GetChannelRulesResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      messagingChannelValidationServiceApi.GetChannelRulesResponse.fromPartial({ channel: { channelId: (req?.channelId ?? "") } }),
    );
  }

  /**
   * Normalizes a channel.
   */
  async normalizeChannel(req: messagingChannelValidationServiceApi.NormalizeChannelRequest): Promise<messagingChannelValidationServiceApi.NormalizeChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "NormalizeChannel", req);
    this.logger.info("normalize_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.recipient ?? ""),
        },
      },
      mediaAsset: { owner: { displayName: (req?.channel?.owner?.displayName ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.media.v1.QuoteMediaAssetRequest",
      value: Buffer.from(mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.encode(request1).finish()),
    });
    const unpacked1 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.decode(envelope1.value);
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.quoteMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse>(invoke1, unpacked1);
    const request2 = formsFormFieldValidationServiceApi.LintFormFieldsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.channel?.owner?.email ?? ""),
          name: req?.details?.contact?.name,
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
      formField: { audit: { updatedBy: (req?.channel?.audit?.updatedBy ?? "") } },
    });
    const client2 = this.clients.get<formsFormFieldValidationServiceApi.FormFieldValidationServiceClient>("acme.forms.v1.FormFieldValidationService");
    const invoke2: Unary<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse> =
      (input, done) => client2.lintFormFields(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelValidationServiceApi.NormalizeChannelResponse.fromPartial({
        channel: { audit: { createdBy: (reply1?.mediaAsset?.audit?.createdBy ?? "") } },
      }),
      messagingChannelValidationServiceApi.NormalizeChannelResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      messagingChannelValidationServiceApi.NormalizeChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          status: req?.channel?.status,
        },
      }),
    );
  }

  /**
   * Previews a channel.
   */
  async previewChannel(req: messagingChannelValidationServiceApi.PreviewChannelRequest): Promise<messagingChannelValidationServiceApi.PreviewChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "PreviewChannel", req);
    this.logger.info("preview_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureValidationServiceApi.ValidateExposureRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          name: req?.details?.contact?.name,
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<experimentsExposureValidationServiceApi.ValidateExposureRequest, experimentsExposureValidationServiceApi.ValidateExposureResponse> =
      (input, done) => this.experimentsExposureValidationClient.validateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<experimentsExposureValidationServiceApi.ValidateExposureRequest, experimentsExposureValidationServiceApi.ValidateExposureResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelValidationServiceApi.PreviewChannelResponse.fromPartial({
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingChannelValidationServiceApi.PreviewChannelResponse.fromPartial({
        channel: {
          channelId: (req?.channelId ?? ""),
          status: req?.channel?.status,
        },
      }),
    );
  }

  /**
   * Scores a channel.
   */
  async scoreChannel(req: messagingChannelValidationServiceApi.ScoreChannelRequest): Promise<messagingChannelValidationServiceApi.ScoreChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ScoreChannel", req);
    this.logger.info("score_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (req?.channel?.owner?.email ?? "") } },
    });
    const invoke1: Unary<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.subscribeNotificationUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse>(invoke1, request1));
    let selected2_1: string | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected2_1 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = personalizationProfileValidationServiceApi.LintProfilesRequest.fromPartial({
      context: req?.context,
      profile: {
        primaryAddress: { recipient: (selected2_1 ?? "") },
        relationshipManager: { displayName: (reply1?.notification?.assignee?.displayName ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse> =
      (input, done) => this.personalizationProfileValidationClient.lintProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileValidationServiceApi.LintProfilesRequest, personalizationProfileValidationServiceApi.LintProfilesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelValidationServiceApi.ScoreChannelResponse.fromPartial({
        channel: { audit: { updatedBy: (reply1?.notification?.audit?.updatedBy ?? "") } },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      messagingChannelValidationServiceApi.ScoreChannelResponse.fromPartial({ channel: { audit: { createdAt: reply2?.profile?.audit?.createdAt } } }),
      messagingChannelValidationServiceApi.ScoreChannelResponse.fromPartial({
        channel: {
          capacity: (req?.channel?.capacity ?? 0),
          channelId: (req?.channelId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a channel.
   */
  async validateChannel(req: messagingChannelValidationServiceApi.ValidateChannelRequest): Promise<messagingChannelValidationServiceApi.ValidateChannelResponse> {
    validateContext(req.context);
    if (req.channel) {
      await this.repository.save(toChannelRecord(req.context.tenantId, req.channel));
    }
    await this.repository.record(req.context.tenantId, "ValidateChannel", req);
    this.logger.info("validate_channel", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest.fromPartial({
      context: req?.context,
      conversation: {
        requester: {
          email: (req?.channel?.owner?.email ?? ""),
          name: req?.details?.contact?.name,
        },
      },
    });
    const invoke1: Unary<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> =
      (input, done) => this.messagingConversationCalculationClient.explainConversationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest.fromPartial({
      context: req?.context,
      participant: {
        primaryAddress: {
          postalCode: ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.postalCode ?? ""),
        },
        relationshipManager: {
          displayName: ((reply1?.conversation?.origin?.$case === "customer" ? reply1?.conversation?.origin.customer : undefined)?.displayName ?? ""),
          userId: (reply1?.conversation?.assignee?.userId ?? ""),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest, messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse>(
      "acme.messaging.v1.ChannelValidationService/ValidateChannel:1", request2,
    );
    let selected3_1: string | undefined;
    switch (req?.channel?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.channel?.locator?.$case === "address" ? req?.channel?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = messagingConversationCalculationServiceApi.CalculateConversationRequest.fromPartial({
      context: req?.context,
      conversation: { requester: { name: reply2?.participant?.contact?.name } },
      details: { destination: { countryCode: (selected3_1 ?? "") } },
    });
    const invoke3: Unary<messagingConversationCalculationServiceApi.CalculateConversationRequest, messagingConversationCalculationServiceApi.CalculateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.calculateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingConversationCalculationServiceApi.CalculateConversationRequest, messagingConversationCalculationServiceApi.CalculateConversationResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChannelValidationServiceApi.ValidateChannelResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      messagingChannelValidationServiceApi.ValidateChannelResponse.fromPartial({
        channel: { audit: { updatedBy: (reply2?.participant?.audit?.updatedBy ?? "") } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      messagingChannelValidationServiceApi.ValidateChannelResponse.fromPartial({
        channel: {
          channelId: ((reply3?.conversation?.origin?.$case === "customer" ? reply3?.conversation?.origin.customer : undefined)?.channelId ?? ""),
        },
      }),
      messagingChannelValidationServiceApi.ValidateChannelResponse.fromPartial({
        channel: {
          capacity: (req?.channel?.capacity ?? 0),
          name: (req?.channel?.name ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChannelValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ChannelValidationHandler {
  constructor(@inject(ChannelValidationWorkflow) private readonly workflow: ChannelValidationWorkflow) {}

  /**
   * Checks a channel.
   */
  checkChannelEligibility = unary<messagingChannelValidationServiceApi.CheckChannelEligibilityRequest, messagingChannelValidationServiceApi.CheckChannelEligibilityResponse>(
    (request) => this.workflow.checkChannelEligibility(request),
  );

  /**
   * Explains a channel.
   */
  explainChannelDecision = unary<messagingChannelValidationServiceApi.ExplainChannelDecisionRequest, messagingChannelValidationServiceApi.ExplainChannelDecisionResponse>(
    (request) => this.workflow.explainChannelDecision(request),
  );

  /**
   * Returns a channel.
   */
  getChannelRules = (call: ServerUnaryCall<messagingChannelValidationServiceApi.GetChannelRulesRequest, messagingChannelValidationServiceApi.GetChannelRulesResponse>, done: sendUnaryData<messagingChannelValidationServiceApi.GetChannelRulesResponse>): void => {
    void this.workflow.getChannelRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes a channel.
   */
  normalizeChannel = unary<messagingChannelValidationServiceApi.NormalizeChannelRequest, messagingChannelValidationServiceApi.NormalizeChannelResponse>(
    (request) => this.workflow.normalizeChannel(request),
  );

  /**
   * Previews a channel.
   */
  previewChannel = unary<messagingChannelValidationServiceApi.PreviewChannelRequest, messagingChannelValidationServiceApi.PreviewChannelResponse>(
    (request) => this.workflow.previewChannel(request),
  );

  /**
   * Scores a channel.
   */
  scoreChannel = (call: ServerUnaryCall<messagingChannelValidationServiceApi.ScoreChannelRequest, messagingChannelValidationServiceApi.ScoreChannelResponse>, done: sendUnaryData<messagingChannelValidationServiceApi.ScoreChannelResponse>): void => {
    void this.workflow.scoreChannel(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a channel.
   */
  validateChannel = unary<messagingChannelValidationServiceApi.ValidateChannelRequest, messagingChannelValidationServiceApi.ValidateChannelResponse>(
    (request) => this.workflow.validateChannel(request),
  );
}

export function implementation(handler: ChannelValidationHandler): messagingChannelValidationServiceApi.ChannelValidationServiceServer {
  return {
    checkChannelEligibility: handler.checkChannelEligibility,
    explainChannelDecision: handler.explainChannelDecision,
    getChannelRules: handler.getChannelRules,
    normalizeChannel: handler.normalizeChannel,
    previewChannel: handler.previewChannel,
    scoreChannel: handler.scoreChannel,
    validateChannel: handler.validateChannel,
  };
}
