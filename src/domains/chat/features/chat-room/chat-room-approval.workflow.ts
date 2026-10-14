/**
 * Routes chat rooms through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as chatChatRoomLifecycleServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_lifecycle_service.js";
import * as chatChatRoomQueryServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as chatChatRoomServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as communityBadgeWorkflowServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as localizationTranslationJobWorkflowServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as promotionsPromotionServiceApi from "../../../../../.cache/proto/acme/promotions/v1/promotion_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { collect, upload, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toChatRoomRecord } from "../../data/records.js";
import { ChatRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat room operations and persist audit data.
 */
@injectable()
export class ChatRoomApprovalWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomLifecycleService") private readonly chatChatRoomLifecycleClient: chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomQueryService") private readonly chatChatRoomQueryClient: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.community.v1.BadgeWorkflowService") private readonly communityBadgeWorkflowClient: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.experiments.v1.VariantWorkflowService") private readonly experimentsVariantWorkflowClient: experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobWorkflowService") private readonly localizationTranslationJobWorkflowClient: localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileLifecycleService") private readonly personalizationProfileLifecycleClient: personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient,
    @inject("grpc:acme.promotions.v1.PromotionService") private readonly promotionsPromotionClient: promotionsPromotionServiceApi.PromotionServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryApprovalService") private readonly webhooksWebhookDeliveryApprovalClient: webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a chat room.
   */
  async approveChatRoom(req: chatChatRoomApprovalServiceApi.ApproveChatRoomRequest): Promise<chatChatRoomApprovalServiceApi.ApproveChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "ApproveChatRoom", req);
    this.logger.info("approve_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = promotionsPromotionServiceApi.CreatePromotionRequest.fromPartial({
      context: req?.context,
      promotion: {
        audit: { etag: (req?.chatRoom?.audit?.etag ?? "") },
        owner: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const invoke1: Unary<promotionsPromotionServiceApi.CreatePromotionRequest, promotionsPromotionServiceApi.CreatePromotionResponse> =
      (input, done) => this.promotionsPromotionClient.createPromotion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<promotionsPromotionServiceApi.CreatePromotionRequest, promotionsPromotionServiceApi.CreatePromotionResponse>(invoke1, request1);
    const request2 = chatChatRoomServiceApi.DeleteChatRoomRequest.fromPartial({
      chatRoomId: (req?.chatRoomId ?? ""),
      context: req?.context,
      etag: (req?.chatRoom?.audit?.etag ?? ""),
      reason: ((reply1?.promotion?.action?.$case === "block" ? reply1?.promotion?.action.block : undefined)?.reason ?? ""),
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<chatChatRoomServiceApi.DeleteChatRoomRequest, chatChatRoomServiceApi.DeleteChatRoomResponse> =
      (input, done) => this.chatChatRoomClient.deleteChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomServiceApi.DeleteChatRoomRequest, chatChatRoomServiceApi.DeleteChatRoomResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = experimentsVariantWorkflowServiceApi.RetryVariantWorkflowRequest.fromPartial({
      context: input3?.context,
      details: { notify: { email: (reply1?.promotion?.owner?.email ?? "") } },
      variant: {
        audit: {
          createdAt: reply1?.promotion?.audit?.createdAt,
          createdBy: (input3?.chatRoom?.audit?.createdBy ?? ""),
        },
        owner: { userId: (input3?.chatRoom?.owner?.userId ?? "") },
      },
    });
    const invoke3: Unary<experimentsVariantWorkflowServiceApi.RetryVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse> =
      (input, done) => this.experimentsVariantWorkflowClient.retryVariantWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsVariantWorkflowServiceApi.RetryVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.RetryVariantWorkflowResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomApprovalServiceApi.ApproveChatRoomResponse.fromPartial({ chatRoom: { owner: reply1?.promotion?.owner } }),
      chatChatRoomApprovalServiceApi.ApproveChatRoomResponse.fromPartial({ outcome: { effectiveAt: reply2?.effectiveAt } }),
      chatChatRoomApprovalServiceApi.ApproveChatRoomResponse.fromPartial({
        chatRoom: { name: (reply3?.variant?.name ?? "") },
        outcome: { message: (reply3?.outcome?.message ?? "") },
      }),
      chatChatRoomApprovalServiceApi.ApproveChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          code: (req?.chatRoom?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a chat room.
   */
  async commentChatRoomApproval(req: chatChatRoomApprovalServiceApi.CommentChatRoomApprovalRequest): Promise<chatChatRoomApprovalServiceApi.CommentChatRoomApprovalResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "CommentChatRoomApproval", req);
    this.logger.info("comment_chat_room_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chatRoom?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = chatChatRoomServiceApi.SearchChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatRoom?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<chatChatRoomServiceApi.SearchChatRoomsRequest, chatChatRoomServiceApi.SearchChatRoomsResponse> =
      (input, done) => this.chatChatRoomClient.searchChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomServiceApi.SearchChatRoomsRequest, chatChatRoomServiceApi.SearchChatRoomsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomApprovalServiceApi.CommentChatRoomApprovalResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      chatChatRoomApprovalServiceApi.CommentChatRoomApprovalResponse.fromPartial({
        chatRoom: { chatRoomId: (req?.chatRoomId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Delegates a chat room.
   */
  async delegateChatRoomApproval(req: chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalRequest): Promise<chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "DelegateChatRoomApproval", req);
    this.logger.info("delegate_chat_room_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: {
          etag: (req?.chatRoom?.audit?.etag ?? ""),
          updatedBy: (req?.chatRoom?.audit?.updatedBy ?? ""),
        },
        owner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          userId: (req?.chatRoom?.owner?.userId ?? ""),
        },
      },
    });
    const decoded1 = featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest.fromJSON(
      JSON.parse(JSON.stringify(featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest.toJSON(request1))),
    );
    const invoke1: Unary<featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CreateFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.createFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CreateFeatureFlagResponse>(invoke1, decoded1);
    const request2 = localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { email: (req?.details?.approver?.email ?? "") },
        audit: { updatedAt: req?.chatRoom?.audit?.updatedAt },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.RetryTranslationJobWorkflowRequest",
      value: Buffer.from(localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest.encode(request2).finish()),
    });
    const unpacked2 = localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest.decode(envelope2.value);
    const invoke2: Unary<localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse> =
      (input, done) => this.localizationTranslationJobWorkflowClient.retryTranslationJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.RetryTranslationJobWorkflowResponse>(invoke2, unpacked2);
    const request3 = chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleRequest.fromPartial({
      chatRoomId: (req?.chatRoom?.chatRoomId ?? ""),
      context: req?.context,
    });
    const client3 = this.clients.get<chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceClient>("acme.chat.v1.ChatRoomLifecycleService");
    const invoke3: Unary<chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleRequest, chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleResponse> =
      (input, done) => client3.getChatRoomLifecycle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleRequest, chatChatRoomLifecycleServiceApi.GetChatRoomLifecycleResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalResponse.fromPartial({ chatRoom: { name: (reply1?.featureFlag?.name ?? "") } }),
      chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalResponse.fromPartial({
        chatRoom: { owner: { email: (reply2?.translationJob?.assignee?.email ?? "") } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalResponse.fromPartial({
        chatRoom: {
          components: { primary: {
            description: (reply3?.chatRoom?.components?.["primary"]?.description ?? ""),
          } },
          dimensions: { weight: (reply3?.chatRoom?.dimensions?.weight ?? 0) },
        },
      }),
      chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          specs: (req?.chatRoom?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Returns a chat room.
   */
  async getChatRoomApprovalStatus(req: chatChatRoomApprovalServiceApi.GetChatRoomApprovalStatusRequest): Promise<chatChatRoomApprovalServiceApi.GetChatRoomApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatRoomApprovalStatus", req);
    this.logger.info("get_chat_room_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        sla: { dueAt: req?.context?.deadline },
      },
    });
    const invoke1: Unary<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse> =
      (input, done) => this.localizationTranslationJobWorkflowClient.advanceTranslationJobWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.AdvanceTranslationJobWorkflowResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (reply1?.translationJob?.requester?.email ?? "") } },
      profile: {
        contact: {
          email: ((reply1?.translationJob?.origin?.$case === "customer" ? reply1?.translationJob?.origin.customer : undefined)?.email ?? ""),
          name: reply1?.translationJob?.requester?.name,
        },
      },
    });
    const invoke2: Unary<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest, personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse> =
      (input, done) => this.personalizationProfileLifecycleClient.scheduleProfileExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest, personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse>(invoke2, request2));
    const request3 = personalizationAffinitySyncServiceApi.StreamAffinityChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        occurredAt: req?.context?.deadline,
        source: (req?.chatRoomId ?? ""),
      } },
      context: req?.context,
    });
    const stream3 = this.personalizationAffinitySyncClient.streamAffinityChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse.fromPartial({});
    return mergeResponses(
      chatChatRoomApprovalServiceApi.GetChatRoomApprovalStatusResponse.fromPartial({
        chatRoom: {
          owner: { displayName: (reply1?.translationJob?.assignee?.displayName ?? "") },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      chatChatRoomApprovalServiceApi.GetChatRoomApprovalStatusResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      chatChatRoomApprovalServiceApi.GetChatRoomApprovalStatusResponse.fromPartial({ chatRoom: { chatRoomId: (req?.chatRoomId ?? "") } }),
    );
  }

  /**
   * Lists chat rooms a page at a time.
   */
  async listPendingChatRooms(req: chatChatRoomApprovalServiceApi.ListPendingChatRoomsRequest): Promise<chatChatRoomApprovalServiceApi.ListPendingChatRoomsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingChatRooms", req);
    this.logger.info("list_pending_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatRoomApprovalServiceApi.ListPendingChatRoomsResponse.fromPartial({});
  }

  /**
   * Recalls a chat room.
   */
  async recallChatRoom(req: chatChatRoomApprovalServiceApi.RecallChatRoomRequest): Promise<chatChatRoomApprovalServiceApi.RecallChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "RecallChatRoom", req);
    this.logger.info("recall_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chatRoom?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = authorizationAccessPolicyServiceApi.ListAccessPoliciesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatRoom?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.chatRoom?.specs ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<authorizationAccessPolicyServiceApi.ListAccessPoliciesRequest, authorizationAccessPolicyServiceApi.ListAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyClient.listAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyServiceApi.ListAccessPoliciesRequest, authorizationAccessPolicyServiceApi.ListAccessPoliciesResponse>(invoke1, request1);
    const request2 = chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          lines: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.lines ?? []).map((value) => value),
        } },
        components: { primary: {
          componentId: (req?.chatRoom?.components?.["primary"]?.componentId ?? ""),
        } },
        dimensions: {
          length: (req?.chatRoom?.dimensions?.length ?? 0),
          width: (req?.chatRoom?.dimensions?.width ?? 0),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse> =
      (input, done) => this.chatChatRoomValidationClient.checkChatRoomEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomApprovalServiceApi.RecallChatRoomResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatChatRoomApprovalServiceApi.RecallChatRoomResponse.fromPartial({
        chatRoom: { audit: { createdBy: (reply2?.chatRoom?.audit?.createdBy ?? "") } },
      }),
      chatChatRoomApprovalServiceApi.RecallChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          name: (req?.chatRoom?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a chat room.
   */
  async rejectChatRoom(req: chatChatRoomApprovalServiceApi.RejectChatRoomRequest): Promise<chatChatRoomApprovalServiceApi.RejectChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "RejectChatRoom", req);
    this.logger.info("reject_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomLifecycleServiceApi.RenewChatRoomRequest.fromPartial({
      chatRoomId: (req?.chatRoom?.chatRoomId ?? ""),
      context: req?.context,
      details: { newOwner: { displayName: (req?.chatRoom?.owner?.displayName ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<chatChatRoomLifecycleServiceApi.RenewChatRoomRequest, chatChatRoomLifecycleServiceApi.RenewChatRoomResponse>(
      "acme.chat.v1.ChatRoomApprovalService/RejectChatRoom:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatRoomApprovalServiceApi.RejectChatRoomResponse.fromPartial({
        chatRoom: {
          audit: { updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? "") },
          capacity: (reply1?.chatRoom?.capacity ?? 0),
        },
      }),
      chatChatRoomApprovalServiceApi.RejectChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          code: (req?.chatRoom?.code ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a chat room.
   */
  async submitChatRoom(req: chatChatRoomApprovalServiceApi.SubmitChatRoomRequest): Promise<chatChatRoomApprovalServiceApi.SubmitChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "SubmitChatRoom", req);
    this.logger.info("submit_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureReportingServiceApi.ScheduleExposureReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.chatRoom?.specs ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<experimentsExposureReportingServiceApi.ScheduleExposureReportRequest, experimentsExposureReportingServiceApi.ScheduleExposureReportResponse> =
      (input, done) => this.experimentsExposureReportingClient.scheduleExposureReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<experimentsExposureReportingServiceApi.ScheduleExposureReportRequest, experimentsExposureReportingServiceApi.ScheduleExposureReportResponse>(invoke1, request1));
    const request2 = communityBadgeWorkflowServiceApi.PauseBadgeWorkflowRequest.fromPartial({
      badge: {
        audit: { updatedBy: (req?.chatRoom?.audit?.updatedBy ?? "") },
        owner: {
          displayName: (req?.chatRoom?.owner?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      context: req?.context,
      details: { notify: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke2: Unary<communityBadgeWorkflowServiceApi.PauseBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.pauseBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<communityBadgeWorkflowServiceApi.PauseBadgeWorkflowResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest.fromPartial({
      chatRoomId: (req?.chatRoom?.chatRoomId ?? ""),
      context: req?.context,
    });
    const invoke3: Unary<chatChatRoomQueryServiceApi.SummarizeChatRoomsRequest, chatChatRoomQueryServiceApi.SummarizeChatRoomsResponse> =
      (input, done) => this.chatChatRoomQueryClient.summarizeChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    const request4 = webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.chatRoom?.owner?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        },
      },
      webhookDelivery: {
        subject: {
          code: (req?.chatRoom?.code ?? ""),
          displayName: (req?.details?.approver?.displayName ?? ""),
        },
      },
    });
    const invoke4: Unary<webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryRequest, webhooksWebhookDeliveryApprovalServiceApi.RecallWebhookDeliveryResponse> =
      (input, done) => this.webhooksWebhookDeliveryApprovalClient.recallWebhookDelivery(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    const request5 = chatChatRoomServiceApi.BatchCreateChatRoomsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.chatRoom?.chatRoomId ?? ""),
        submittedBy: { email: (req?.chatRoom?.owner?.email ?? "") },
      } },
    });
    const reply5 = await upload<chatChatRoomServiceApi.BatchCreateChatRoomsRequest, chatChatRoomServiceApi.BatchCreateChatRoomsResponse>(
      (done) => this.chatChatRoomClient.batchCreateChatRooms(metadataFor(request5.context), { deadline: Date.now() + 15_000 }, done), [request5],
    );
    this.logger.info("local_audit", { value: (req?.details?.comment ?? "") });
    return mergeResponses(
      chatChatRoomApprovalServiceApi.SubmitChatRoomResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      chatChatRoomApprovalServiceApi.SubmitChatRoomResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      chatChatRoomApprovalServiceApi.SubmitChatRoomResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      chatChatRoomApprovalServiceApi.SubmitChatRoomResponse.fromPartial({ outcome: { status: (reply4?.result?.status ?? "") } }),
      chatChatRoomApprovalServiceApi.SubmitChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoomId ?? ""),
          owner: req?.chatRoom?.owner,
        },
      }),
    );
  }
}
