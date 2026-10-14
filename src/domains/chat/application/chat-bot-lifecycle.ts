/**
 * Moves a chat bot between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as chatChatBotLifecycleServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as chatChatBotReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as lineageLineageNodeQueryServiceApi from "../../../../.cache/proto/acme/lineage/v1/lineage_node_query_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as toursTourServiceApi from "../../../../.cache/proto/acme/tours/v1/tour_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
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
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatBotRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat bot operations and persist audit data.
 */
@injectable()
export class ChatBotLifecycleWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotReportingService") private readonly chatChatBotReportingClient: chatChatBotReportingServiceApi.ChatBotReportingServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffReportingService") private readonly chatHandoffReportingClient: chatHandoffReportingServiceApi.HandoffReportingServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.lineage.v1.LineageNodeQueryService") private readonly lineageLineageNodeQueryClient: lineageLineageNodeQueryServiceApi.LineageNodeQueryServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.tours.v1.TourService") private readonly toursTourClient: toursTourServiceApi.TourServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a chat bot.
   */
  async activateChatBot(req: chatChatBotLifecycleServiceApi.ActivateChatBotRequest): Promise<chatChatBotLifecycleServiceApi.ActivateChatBotResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateChatBot", req);
    this.logger.info("activate_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.EstimateChatRoomRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      chatRoom: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.estimateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.EstimateChatRoomRequest, chatChatRoomCalculationServiceApi.EstimateChatRoomResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = lineageLineageNodeQueryServiceApi.ResolveLineageNodesRequest.fromPartial({ context: input2?.context });
    const invoke2: Unary<lineageLineageNodeQueryServiceApi.ResolveLineageNodesRequest, lineageLineageNodeQueryServiceApi.ResolveLineageNodesResponse> =
      (input, done) => this.lineageLineageNodeQueryClient.resolveLineageNodes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<lineageLineageNodeQueryServiceApi.ResolveLineageNodesRequest, lineageLineageNodeQueryServiceApi.ResolveLineageNodesResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (reply1?.chatRoom?.locator?.$case) {
      case "address":
        selected3_1 = ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected3_1 ?? "") },
    });
    const invoke3: Unary<ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest, ledgerLedgerAccountServiceApi.ListLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountClient.listLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountServiceApi.ListLedgerAccountsRequest, ledgerLedgerAccountServiceApi.ListLedgerAccountsResponse>(invoke3, request3);
    const request4 = notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: {
          notifyEmail: (req?.context?.actor?.email ?? ""),
          reason: (req?.reason ?? ""),
        } },
        scopes: (req?.context?.actor?.roles ?? []).map((value) => value),
      } },
      context: req?.context,
    });
    const stream4 = this.notificationsSubscriptionSyncClient.streamSubscriptionChanges(metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const reading4 = collect(stream4);
    const writing4 = (async () => {
      await write(stream4, request4);
      stream4.end();
    })();
    const [messages4] = await Promise.all([reading4, writing4]);
    const reply4 = messages4.at(-1) ?? notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      chatChatBotLifecycleServiceApi.ActivateChatBotResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatChatBotLifecycleServiceApi.ActivateChatBotResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      chatChatBotLifecycleServiceApi.ActivateChatBotResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      chatChatBotLifecycleServiceApi.ActivateChatBotResponse.fromPartial({
        chatBot: { chatBotId: (req?.chatBotId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a chat bot.
   */
  async expireChatBot(req: chatChatBotLifecycleServiceApi.ExpireChatBotRequest): Promise<chatChatBotLifecycleServiceApi.ExpireChatBotResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireChatBot", req);
    this.logger.info("expire_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.ValidateChatRoomRequest.fromPartial({
      chatRoom: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const decoded1 = chatChatRoomValidationServiceApi.ValidateChatRoomRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatRoomValidationServiceApi.ValidateChatRoomRequest.toJSON(request1))),
    );
    const invoke1: Unary<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.validateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotLifecycleServiceApi.ExpireChatBotResponse.fromPartial({ chatBot: { audit: { updatedAt: reply1?.chatRoom?.audit?.updatedAt } } }),
      chatChatBotLifecycleServiceApi.ExpireChatBotResponse.fromPartial({
        chatBot: { chatBotId: (req?.chatBotId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a chat bot.
   */
  async getChatBotLifecycle(req: chatChatBotLifecycleServiceApi.GetChatBotLifecycleRequest): Promise<chatChatBotLifecycleServiceApi.GetChatBotLifecycleResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatBotLifecycle", req);
    this.logger.info("get_chat_bot_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        occurredAt: req?.context?.deadline,
        source: (req?.chatBotId ?? ""),
      } },
      context: req?.context,
    });
    const stream1 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const reading1 = collect(stream1);
    const writing1 = (async () => {
      await write(stream1, request1);
      stream1.end();
    })();
    const [messages1] = await Promise.all([reading1, writing1]);
    const reply1 = messages1.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    return chatChatBotLifecycleServiceApi.GetChatBotLifecycleResponse.fromPartial({ chatBot: { chatBotId: (req?.chatBotId ?? "") } });
  }

  /**
   * Reinstates a chat bot.
   */
  async reinstateChatBot(req: chatChatBotLifecycleServiceApi.ReinstateChatBotRequest): Promise<chatChatBotLifecycleServiceApi.ReinstateChatBotResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateChatBot", req);
    this.logger.info("reinstate_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffReportingServiceApi.ShareHandoffReportRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.chat.v1.ShareHandoffReportRequest",
      value: Buffer.from(chatHandoffReportingServiceApi.ShareHandoffReportRequest.encode(request1).finish()),
    });
    const unpacked1 = chatHandoffReportingServiceApi.ShareHandoffReportRequest.decode(envelope1.value);
    const invoke1: Unary<chatHandoffReportingServiceApi.ShareHandoffReportRequest, chatHandoffReportingServiceApi.ShareHandoffReportResponse> =
      (input, done) => this.chatHandoffReportingClient.shareHandoffReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatHandoffReportingServiceApi.ShareHandoffReportRequest, chatHandoffReportingServiceApi.ShareHandoffReportResponse>(invoke1, unpacked1);
    const request2 = identityUserServiceApi.WatchUsersRequest.fromPartial({
      context: req?.context,
      subscriber: {
        email: (req?.details?.notifyContact?.email ?? ""),
        name: reply1?.handoff?.requester?.name,
        phone: (reply1?.handoff?.requester?.phone ?? ""),
        preferredChannel: (reply1?.handoff?.requester?.preferredChannel ?? ""),
      },
    });
    const stream2 = this.identityUserClient.watchUsers(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? identityUserServiceApi.WatchUsersResponse.fromPartial({});
    let selected3_1: string | undefined;
    switch (reply1?.handoff?.origin?.$case) {
      case "customer":
        selected3_1 = ((reply1?.handoff?.origin?.$case === "customer" ? reply1?.handoff?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = personalizationAffinitySyncServiceApi.PullAffinitiesRequest.fromPartial({
      affinity: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (selected3_1 ?? "") },
      },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke3: Unary<personalizationAffinitySyncServiceApi.PullAffinitiesRequest, personalizationAffinitySyncServiceApi.PullAffinitiesResponse> =
      (input, done) => this.personalizationAffinitySyncClient.pullAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinitySyncServiceApi.PullAffinitiesRequest, personalizationAffinitySyncServiceApi.PullAffinitiesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      chatChatBotLifecycleServiceApi.ReinstateChatBotResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      chatChatBotLifecycleServiceApi.ReinstateChatBotResponse.fromPartial({
        outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      chatChatBotLifecycleServiceApi.ReinstateChatBotResponse.fromPartial({
        chatBot: { chatBotId: (req?.chatBotId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a chat bot.
   */
  async renewChatBot(req: chatChatBotLifecycleServiceApi.RenewChatBotRequest): Promise<chatChatBotLifecycleServiceApi.RenewChatBotResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewChatBot", req);
    this.logger.info("renew_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffReportingServiceApi.ScheduleHandoffReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke1: Unary<chatHandoffReportingServiceApi.ScheduleHandoffReportRequest, chatHandoffReportingServiceApi.ScheduleHandoffReportResponse> =
      (input, done) => this.chatHandoffReportingClient.scheduleHandoffReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<chatHandoffReportingServiceApi.ScheduleHandoffReportRequest, chatHandoffReportingServiceApi.ScheduleHandoffReportResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = chatChatRoomValidationServiceApi.PreviewChatRoomRequest.fromPartial({
      chatRoom: { owner: { email: (req?.details?.newOwner?.email ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.previewChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotLifecycleServiceApi.RenewChatBotResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      chatChatBotLifecycleServiceApi.RenewChatBotResponse.fromPartial({
        chatBot: { audit: { createdBy: (reply2?.chatRoom?.audit?.createdBy ?? "") } },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      chatChatBotLifecycleServiceApi.RenewChatBotResponse.fromPartial({
        chatBot: { chatBotId: (req?.chatBotId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a chat bot.
   */
  async scheduleChatBotExpiry(req: chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest): Promise<chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse> {
    validateContext(req.context);
    if (req.chatBot) {
      await this.repository.save(toChatBotRecord(req.context.tenantId, req.chatBot));
    }
    await this.repository.record(req.context.tenantId, "ScheduleChatBotExpiry", req);
    this.logger.info("schedule_chat_bot_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.CloneUserRequest.fromPartial({
      context: req?.context,
      user: {
        relationshipManager: {
          displayName: (req?.chatBot?.owner?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse> =
      (input, done) => this.identityUserClient.cloneUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ScheduleChatBotExpiry.CloneUser", () => call<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse>(invoke1, request1));
    const request2 = toursTourServiceApi.ListToursRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatBot?.audit?.updatedAt,
        ownerId: (reply1?.user?.relationshipManager?.userId ?? ""),
        region: (reply1?.user?.primaryAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<toursTourServiceApi.ListToursRequest, toursTourServiceApi.ListToursResponse> =
      (input, done) => this.toursTourClient.listTours(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = chatChatRoomValidationServiceApi.PreviewChatRoomRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.user?.contact?.email ?? "") } },
    });
    const reply3 = await this.workQueue.enqueue<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse>(
      "acme.chat.v1.ChatBotLifecycleService/ScheduleChatBotExpiry:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse.fromPartial({
        chatBot: { audit: { createdBy: (reply1?.user?.audit?.createdBy ?? "") } },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse.fromPartial({ chatBot: { audit: { etag: (reply3?.chatRoom?.audit?.etag ?? "") } } }),
      chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse.fromPartial({
        chatBot: {
          chatBotId: (req?.chatBotId ?? ""),
          parameters: (req?.details?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Suspends a chat bot.
   */
  async suspendChatBot(req: chatChatBotLifecycleServiceApi.SuspendChatBotRequest): Promise<chatChatBotLifecycleServiceApi.SuspendChatBotResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendChatBot", req);
    this.logger.info("suspend_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest.fromPartial({
      chatRoom: { owner: { email: (req?.details?.notifyContact?.email ?? "") } },
      context: req?.context,
    });
    const invoke1: Unary<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse> =
      (input, done) => this.chatChatRoomCalculationClient.recalculateChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse>(invoke1, request1));
    const request2 = chatHandoffSyncServiceApi.ReconcileHandoffsRequest.fromPartial({
      context: req?.context,
      handoff: {
        assignee: {
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (reply1?.chatRoom?.owner?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse> =
      (input, done) => this.chatHandoffSyncClient.reconcileHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<chatHandoffSyncServiceApi.ReconcileHandoffsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotLifecycleServiceApi.SuspendChatBotResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      chatChatBotLifecycleServiceApi.SuspendChatBotResponse.fromPartial({
        chatBot: { priority: (reply2?.handoff?.priority ?? 0) },
        outcome: { message: (reply2?.outcome?.message ?? "") },
      }),
      chatChatBotLifecycleServiceApi.SuspendChatBotResponse.fromPartial({
        chatBot: { chatBotId: (req?.chatBotId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates a chat bot.
   */
  async terminateChatBot(req: chatChatBotLifecycleServiceApi.TerminateChatBotRequest): Promise<chatChatBotLifecycleServiceApi.TerminateChatBotResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateChatBot", req);
    this.logger.info("terminate_chat_bot", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffReportingServiceApi.ListHandoffReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke1: Unary<chatHandoffReportingServiceApi.ListHandoffReportsRequest, chatHandoffReportingServiceApi.ListHandoffReportsResponse> =
      (input, done) => this.chatHandoffReportingClient.listHandoffReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = chatChatBotReportingServiceApi.FetchChatBotReportRequest.fromPartial({
      chatBotId: (req?.chatBotId ?? ""),
      context: req?.context,
    });
    const invoke2: Unary<chatChatBotReportingServiceApi.FetchChatBotReportRequest, chatChatBotReportingServiceApi.FetchChatBotReportResponse> =
      (input, done) => this.chatChatBotReportingClient.fetchChatBotReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        audit: {
          etag: (reply2?.chatBot?.audit?.etag ?? ""),
          updatedBy: (reply2?.chatBot?.audit?.updatedBy ?? ""),
        },
        owner: {
          displayName: (reply2?.chatBot?.owner?.displayName ?? ""),
          userId: (reply2?.chatBot?.owner?.userId ?? ""),
        },
      },
    });
    const method3 = "normalizeMetricSeries" as const;
    const invoke3: Unary<metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotLifecycleServiceApi.TerminateChatBotResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      chatChatBotLifecycleServiceApi.TerminateChatBotResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      chatChatBotLifecycleServiceApi.TerminateChatBotResponse.fromPartial({
        chatBot: { audit: { createdBy: (reply3?.metricSeries?.audit?.createdBy ?? "") } },
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
      }),
      chatChatBotLifecycleServiceApi.TerminateChatBotResponse.fromPartial({
        chatBot: { chatBotId: (req?.chatBotId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
