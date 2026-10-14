/**
 * Computes the figures of a chat room, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as fleetVehicleQueryServiceApi from "../../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as maintenanceWorkOrderCalculationServiceApi from "../../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as ratelimitingRateLimitCalculationServiceApi from "../../../../.cache/proto/acme/ratelimiting/v1/rate_limit_calculation_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import * as yardsYardCalculationServiceApi from "../../../../.cache/proto/acme/yards/v1/yard_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { requireReply } from "../../../platform/errors.js";
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
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatRoomRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat room operations and persist audit data.
 */
@injectable()
export class ChatRoomCalculationWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.fleet.v1.VehicleQueryService") private readonly fleetVehicleQueryClient: fleetVehicleQueryServiceApi.VehicleQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderCalculationService") private readonly maintenanceWorkOrderCalculationClient: maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationHistoryService") private readonly notificationsNotificationHistoryClient: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.ratelimiting.v1.RateLimitCalculationService") private readonly ratelimitingRateLimitCalculationClient: ratelimitingRateLimitCalculationServiceApi.RateLimitCalculationServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointQueryService") private readonly webhooksWebhookEndpointQueryClient: webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient,
    @inject("grpc:acme.yards.v1.YardCalculationService") private readonly yardsYardCalculationClient: yardsYardCalculationServiceApi.YardCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a chat room.
   */
  async calculateChatRoom(req: chatChatRoomCalculationServiceApi.CalculateChatRoomRequest): Promise<chatChatRoomCalculationServiceApi.CalculateChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "CalculateChatRoom", req);
    this.logger.info("calculate_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fleetVehicleQueryServiceApi.CountVehiclesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatRoom?.audit?.updatedAt,
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const method1 = "countVehicles" as const;
    const invoke1: Unary<fleetVehicleQueryServiceApi.CountVehiclesRequest, fleetVehicleQueryServiceApi.CountVehiclesResponse> =
      (input, done) => this.fleetVehicleQueryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<fleetVehicleQueryServiceApi.CountVehiclesRequest, fleetVehicleQueryServiceApi.CountVehiclesResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        measurements: [{ unit: (req?.chatRoom?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.chatRoom?.owner?.displayName ?? "") },
      },
    });
    const proxy2 = forwarding(this.notificationsDeliveryAttemptWorkflowClient);
    const invoke2: Unary<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse> =
      (input, done) => proxy2.startDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomCalculationServiceApi.CalculateChatRoomResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      chatChatRoomCalculationServiceApi.CalculateChatRoomResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      chatChatRoomCalculationServiceApi.CalculateChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          status: req?.chatRoom?.status,
        },
      }),
    );
  }

  /**
   * Compares a chat room.
   */
  async compareChatRoomOptions(req: chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest): Promise<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "CompareChatRoomOptions", req);
    this.logger.info("compare_chat_room_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { locality: (req?.details?.destination?.locality ?? "") },
      },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient.comparePostOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.chatRoom?.owner?.displayName ?? "") } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.signalDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.SignalDeliveryAttemptWorkflowResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = notificationsNotificationServiceApi.SearchNotificationsRequest.fromPartial({
      context: input3?.context,
      filter: {
        createdAfter: input3?.chatRoom?.audit?.updatedAt,
        region: ((input3?.chatRoom?.locator?.$case === "address" ? input3?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke3: Unary<notificationsNotificationServiceApi.SearchNotificationsRequest, notificationsNotificationServiceApi.SearchNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.searchNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationServiceApi.SearchNotificationsRequest, notificationsNotificationServiceApi.SearchNotificationsResponse>(invoke3, request3);
    const request4 = notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromPartial({
      context: req?.context,
      notification: {
        audit: {
          etag: (reply1?.post?.audit?.etag ?? ""),
          updatedAt: reply1?.post?.audit?.updatedAt,
        },
        origin: { $case: "customer", customer: {
          notificationTemplateId: (reply2?.deliveryAttempt?.subject?.notificationTemplateId ?? ""),
          number: (reply2?.deliveryAttempt?.subject?.number ?? ""),
        } },
      },
    });
    const cloned4: notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse> =
      (input, done) => this.notificationsNotificationHistoryClient.compareNotificationVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse.fromPartial({
        chatRoom: { audit: { createdBy: (reply4?.notification?.audit?.createdBy ?? "") } },
      }),
      chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          owner: req?.chatRoom?.owner,
        },
      }),
    );
  }

  /**
   * Estimates a chat room.
   */
  async estimateChatRoom(req: chatChatRoomCalculationServiceApi.EstimateChatRoomRequest): Promise<chatChatRoomCalculationServiceApi.EstimateChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "EstimateChatRoom", req);
    this.logger.info("estimate_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationValidationServiceApi.CheckModerationEligibilityRequest.fromPartial({
      context: req?.context,
      moderation: {
        audit: {
          createdAt: req?.chatRoom?.audit?.createdAt,
          updatedAt: req?.chatRoom?.audit?.updatedAt,
          updatedBy: (req?.chatRoom?.audit?.updatedBy ?? ""),
        },
        origin: { $case: "customer", customer: { displayName: (req?.chatRoom?.owner?.displayName ?? "") } },
      },
    });
    const decoded1 = communityModerationValidationServiceApi.CheckModerationEligibilityRequest.fromJSON(
      JSON.parse(JSON.stringify(communityModerationValidationServiceApi.CheckModerationEligibilityRequest.toJSON(request1))),
    );
    const invoke1: Unary<communityModerationValidationServiceApi.CheckModerationEligibilityRequest, communityModerationValidationServiceApi.CheckModerationEligibilityResponse> =
      (input, done) => this.communityModerationValidationClient.checkModerationEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationValidationServiceApi.CheckModerationEligibilityRequest, communityModerationValidationServiceApi.CheckModerationEligibilityResponse>(invoke1, decoded1);
    const request2 = yardsYardCalculationServiceApi.CompareYardOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: (req?.details?.destination?.recipient ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.yards.v1.CompareYardOptionsRequest",
      value: Buffer.from(yardsYardCalculationServiceApi.CompareYardOptionsRequest.encode(request2).finish()),
    });
    const unpacked2 = yardsYardCalculationServiceApi.CompareYardOptionsRequest.decode(envelope2.value);
    const invoke2: Unary<yardsYardCalculationServiceApi.CompareYardOptionsRequest, yardsYardCalculationServiceApi.CompareYardOptionsResponse> =
      (input, done) => this.yardsYardCalculationClient.compareYardOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<yardsYardCalculationServiceApi.CompareYardOptionsRequest, yardsYardCalculationServiceApi.CompareYardOptionsResponse>(invoke2, unpacked2);
    const request3 = notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest.fromPartial({
      context: req?.context,
      notification: { comments: [{ createdAt: req?.chatRoom?.audit?.createdAt }] },
    });
    const client3 = this.clients.get<notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient>("acme.notifications.v1.NotificationHistoryService");
    const invoke3: Unary<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse> =
      (input, done) => client3.annotateNotificationVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionRequest, notificationsNotificationHistoryServiceApi.AnnotateNotificationVersionResponse>(invoke3, request3);
    const request4 = notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: {
          notificationTemplateId: ((reply3?.notification?.origin?.$case === "customer" ? reply3?.notification?.origin.customer : undefined)?.notificationTemplateId ?? ""),
        },
      },
      details: {
        notify: {
          email: (reply1?.moderation?.assignee?.email ?? ""),
          name: reply3?.notification?.requester?.name,
          preferredChannel: (reply1?.moderation?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const invoke4: Unary<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.retryDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.RetryDeliveryAttemptWorkflowResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomCalculationServiceApi.EstimateChatRoomResponse.fromPartial({
        chatRoom: { audit: { etag: (reply1?.moderation?.audit?.etag ?? "") } },
      }),
      chatChatRoomCalculationServiceApi.EstimateChatRoomResponse.fromPartial({ chatRoom: { audit: { updatedAt: reply2?.yard?.audit?.updatedAt } } }),
      chatChatRoomCalculationServiceApi.EstimateChatRoomResponse.fromPartial({
        chatRoom: { owner: { userId: (reply3?.notification?.assignee?.userId ?? "") } },
        result: { message: (reply3?.outcome?.message ?? "") },
      }),
      chatChatRoomCalculationServiceApi.EstimateChatRoomResponse.fromPartial({
        chatRoom: {
          owner: { displayName: (reply4?.deliveryAttempt?.subject?.displayName ?? "") },
        },
        result: { details: (reply4?.result?.details ?? {}) },
      }),
      chatChatRoomCalculationServiceApi.EstimateChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          status: req?.chatRoom?.status,
        },
      }),
    );
  }

  /**
   * Explains a chat room.
   */
  async explainChatRoomCalculation(req: chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationRequest): Promise<chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "ExplainChatRoomCalculation", req);
    this.logger.info("explain_chat_room_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest, personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.resolveRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<personalizationRecommendationQueryServiceApi.ResolveRecommendationsRequest, personalizationRecommendationQueryServiceApi.ResolveRecommendationsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      chatChatRoomCalculationServiceApi.ExplainChatRoomCalculationResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          specs: (req?.chatRoom?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Quotes a chat room.
   */
  async quoteChatRoom(req: chatChatRoomCalculationServiceApi.QuoteChatRoomRequest): Promise<chatChatRoomCalculationServiceApi.QuoteChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "QuoteChatRoom", req);
    this.logger.info("quote_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ratelimitingRateLimitCalculationServiceApi.RecalculateRateLimitsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (req?.details?.destination?.countryCode ?? "") },
      },
    });
    const invoke1: Unary<ratelimitingRateLimitCalculationServiceApi.RecalculateRateLimitsRequest, ratelimitingRateLimitCalculationServiceApi.RecalculateRateLimitsResponse> =
      (input, done) => this.ratelimitingRateLimitCalculationClient.recalculateRateLimits(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("QuoteChatRoom.RecalculateRateLimits", () => call<ratelimitingRateLimitCalculationServiceApi.RecalculateRateLimitsRequest, ratelimitingRateLimitCalculationServiceApi.RecalculateRateLimitsResponse>(invoke1, request1));
    const request2 = notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.chatRoom?.owner?.email ?? "") } },
      notification: {
        audit: { createdBy: (req?.chatRoom?.audit?.createdBy ?? "") },
        comments: [{ createdAt: reply1?.rateLimit?.audit?.createdAt }],
        requester: { email: (reply1?.rateLimit?.owner?.email ?? "") },
      },
    });
    const invoke2: Unary<notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationRequest, notificationsNotificationCalculationServiceApi.ExplainNotificationCalculationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.explainNotificationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomCalculationServiceApi.QuoteChatRoomResponse.fromPartial({
        chatRoom: { owner: { userId: (reply1?.rateLimit?.owner?.userId ?? "") } },
      }),
      chatChatRoomCalculationServiceApi.QuoteChatRoomResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      chatChatRoomCalculationServiceApi.QuoteChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          status: req?.chatRoom?.status,
        },
      }),
    );
  }

  /**
   * Recalculates a chat room.
   */
  async recalculateChatRooms(req: chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest): Promise<chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "RecalculateChatRooms", req);
    this.logger.info("recalculate_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fleetVehicleQueryServiceApi.ExportVehiclesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatRoom?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.chatRoom?.specs ?? {}))),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream1 = this.fleetVehicleQueryClient.exportVehicles(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? fleetVehicleQueryServiceApi.ExportVehiclesResponse.fromPartial({});
    const request2 = maintenanceWorkOrderCalculationServiceApi.CompareWorkOrderOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<maintenanceWorkOrderCalculationServiceApi.CompareWorkOrderOptionsRequest, maintenanceWorkOrderCalculationServiceApi.CompareWorkOrderOptionsResponse>(
      "acme.chat.v1.ChatRoomCalculationService/RecalculateChatRooms:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse.fromPartial({
        chatRoom: { audit: { updatedBy: (reply2?.workOrder?.audit?.updatedBy ?? "") } },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse.fromPartial({
        chatRoom: {
          capacity: (req?.chatRoom?.capacity ?? 0),
          chatRoomId: (req?.chatRoomId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a chat room.
   */
  async simulateChatRoom(req: chatChatRoomCalculationServiceApi.SimulateChatRoomRequest): Promise<chatChatRoomCalculationServiceApi.SimulateChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "SimulateChatRoom", req);
    this.logger.info("simulate_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = maintenanceWorkOrderCalculationServiceApi.EstimateWorkOrderRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (req?.details?.destination?.locality ?? "") },
      },
      workOrder: {
        assignee: { displayName: (req?.chatRoom?.owner?.displayName ?? "") },
        audit: {
          createdBy: (req?.chatRoom?.audit?.createdBy ?? ""),
          updatedBy: (req?.chatRoom?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke1: Unary<maintenanceWorkOrderCalculationServiceApi.EstimateWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.EstimateWorkOrderResponse> =
      (input, done) => this.maintenanceWorkOrderCalculationClient.estimateWorkOrder(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<maintenanceWorkOrderCalculationServiceApi.EstimateWorkOrderRequest, maintenanceWorkOrderCalculationServiceApi.EstimateWorkOrderResponse>(invoke1, request1));
    const request2 = localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
    });
    const invoke2: Unary<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyQueryClient.browseTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.ResolveWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient.resolveWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomCalculationServiceApi.SimulateChatRoomResponse.fromPartial({
        chatRoom: {
          owner: { displayName: (reply1?.workOrder?.assignee?.displayName ?? "") },
          tags: (reply1?.workOrder?.tags ?? []),
        },
      }),
      chatChatRoomCalculationServiceApi.SimulateChatRoomResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      chatChatRoomCalculationServiceApi.SimulateChatRoomResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      chatChatRoomCalculationServiceApi.SimulateChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          specs: (req?.chatRoom?.specs ?? {}),
        },
      }),
    );
  }
}
