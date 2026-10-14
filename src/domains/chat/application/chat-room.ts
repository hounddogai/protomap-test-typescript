/**
 * Manages chat rooms: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as appointmentsAppointmentServiceApi from "../../../../.cache/proto/acme/appointments/v1/appointment_service.js";
import * as chatChatBotQueryServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatRoomQueryServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as chatChatRoomServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_validation_service.js";
import * as documentsDocumentServiceApi from "../../../../.cache/proto/acme/documents/v1/document_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
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
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatRoomRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat room operations and persist audit data.
 */
@injectable()
export class ChatRoomWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.appointments.v1.AppointmentService") private readonly appointmentsAppointmentClient: appointmentsAppointmentServiceApi.AppointmentServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotQueryService") private readonly chatChatBotQueryClient: chatChatBotQueryServiceApi.ChatBotQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomQueryService") private readonly chatChatRoomQueryClient: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffValidationService") private readonly chatHandoffValidationClient: chatHandoffValidationServiceApi.HandoffValidationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentService") private readonly documentsDocumentClient: documentsDocumentServiceApi.DocumentServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of chat rooms and answers once at the end.
   */
  async batchCreateChatRooms(req: chatChatRoomServiceApi.BatchCreateChatRoomsRequest): Promise<chatChatRoomServiceApi.BatchCreateChatRoomsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateChatRooms", req);
    this.logger.info("batch_create_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_1 = (((choice) => choice?.$case === "address" ? choice.address : undefined)((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.locator)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = chatChatRoomQueryServiceApi.CountChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: { region: (selected1_1 ?? "") },
    });
    const invoke1: Unary<chatChatRoomQueryServiceApi.CountChatRoomsRequest, chatChatRoomQueryServiceApi.CountChatRoomsResponse> =
      (input, done) => this.chatChatRoomQueryClient.countChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomQueryServiceApi.CountChatRoomsRequest, chatChatRoomQueryServiceApi.CountChatRoomsResponse>(invoke1, request1);
    const request2 = chatChatBotQueryServiceApi.SummarizeChatBotsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries(((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.specs ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        format: ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.format ?? ""),
      },
    });
    const invoke2: Unary<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse> =
      (input, done) => this.chatChatBotQueryClient.summarizeChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      chatChatRoomServiceApi.BatchCreateChatRoomsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      chatChatRoomServiceApi.BatchCreateChatRoomsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
    );
  }

  /**
   * Returns several chat rooms at once.
   */
  async batchGetChatRooms(req: chatChatRoomServiceApi.BatchGetChatRoomsRequest): Promise<chatChatRoomServiceApi.BatchGetChatRoomsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetChatRooms", req);
    this.logger.info("batch_get_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    return chatChatRoomServiceApi.BatchGetChatRoomsResponse.fromPartial({});
  }

  /**
   * Creates a chat room.
   */
  async cloneChatRoom(req: chatChatRoomServiceApi.CloneChatRoomRequest): Promise<chatChatRoomServiceApi.CloneChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "CloneChatRoom", req);
    this.logger.info("clone_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomQueryServiceApi.CountChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: {
        region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke1: Unary<chatChatRoomQueryServiceApi.CountChatRoomsRequest, chatChatRoomQueryServiceApi.CountChatRoomsResponse> =
      (input, done) => this.chatChatRoomQueryClient.countChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<chatChatRoomQueryServiceApi.CountChatRoomsRequest, chatChatRoomQueryServiceApi.CountChatRoomsResponse>(invoke1, request1));
    const request2 = chatChatBotQueryServiceApi.SummarizeChatBotsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.chatRoom?.specs ?? {}))),
      },
    });
    const invoke2: Unary<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse> =
      (input, done) => this.chatChatBotQueryClient.summarizeChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CloneChatRoom.SummarizeChatBots", () => call<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      chatChatRoomServiceApi.CloneChatRoomResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      chatChatRoomServiceApi.CloneChatRoomResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      chatChatRoomServiceApi.CloneChatRoomResponse.fromPartial({
        chatRoom: {
          capacity: (req?.chatRoom?.capacity ?? 0),
          owner: req?.chatRoom?.owner,
        },
      }),
    );
  }

  /**
   * Creates a chat room.
   */
  async createChatRoom(req: chatChatRoomServiceApi.CreateChatRoomRequest): Promise<chatChatRoomServiceApi.CreateChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "CreateChatRoom", req);
    this.logger.info("create_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = appointmentsAppointmentServiceApi.ListAppointmentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.chatRoom?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.chatRoom?.specs ?? {}))),
        ownerId: (req?.chatRoom?.chatRoomId ?? ""),
        region: ((req?.chatRoom?.locator?.$case === "address" ? req?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke1: Unary<appointmentsAppointmentServiceApi.ListAppointmentsRequest, appointmentsAppointmentServiceApi.ListAppointmentsResponse> =
      (input, done) => this.appointmentsAppointmentClient.listAppointments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = chatHandoffValidationServiceApi.NormalizeHandoffRequest.fromPartial({
      context: req?.context,
      handoff: {
        audit: {
          createdBy: (req?.chatRoom?.audit?.createdBy ?? ""),
          updatedBy: (req?.chatRoom?.audit?.updatedBy ?? ""),
        },
        requester: { email: (req?.chatRoom?.owner?.email ?? "") },
      },
    });
    const reply2 = await this.workQueue.enqueue<chatHandoffValidationServiceApi.NormalizeHandoffRequest, chatHandoffValidationServiceApi.NormalizeHandoffResponse>(
      "acme.chat.v1.ChatRoomService/CreateChatRoom:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      chatChatRoomServiceApi.CreateChatRoomResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      chatChatRoomServiceApi.CreateChatRoomResponse.fromPartial({
        chatRoom: { audit: { createdBy: (reply2?.handoff?.audit?.createdBy ?? "") } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      chatChatRoomServiceApi.CreateChatRoomResponse.fromPartial({
        chatRoom: {
          name: (req?.chatRoom?.name ?? ""),
          owner: req?.chatRoom?.owner,
        },
      }),
    );
  }

  /**
   * Deletes a chat room.
   */
  async deleteChatRoom(req: chatChatRoomServiceApi.DeleteChatRoomRequest): Promise<chatChatRoomServiceApi.DeleteChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteChatRoom", req);
    this.logger.info("delete_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomQueryServiceApi.LookupChatRoomRequest.fromPartial({
      chatRoomId: (req?.chatRoomId ?? ""),
      context: req?.context,
    });
    const invoke1: Unary<chatChatRoomQueryServiceApi.LookupChatRoomRequest, chatChatRoomQueryServiceApi.LookupChatRoomResponse> =
      (input, done) => this.chatChatRoomQueryClient.lookupChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<chatChatRoomQueryServiceApi.LookupChatRoomRequest, chatChatRoomQueryServiceApi.LookupChatRoomResponse>(invoke1, request1));
    const request2 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.postalCode ?? ""),
        },
      },
      profile: {
        audit: {
          createdBy: (reply1?.chatRoom?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> =
      (input, done) => this.personalizationProfileCalculationClient.recalculateProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return mergeResponses(
      chatChatRoomServiceApi.DeleteChatRoomResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatChatRoomServiceApi.DeleteChatRoomResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Returns a chat room.
   */
  async getChatRoom(req: chatChatRoomServiceApi.GetChatRoomRequest): Promise<chatChatRoomServiceApi.GetChatRoomResponse> {
    validateContext(req.context);
    if (!req.chatRoomId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_room_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetChatRoom", req);
    this.logger.info("get_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    return chatChatRoomServiceApi.GetChatRoomResponse.fromPartial({ chatRoom: { chatRoomId: (req?.chatRoomId ?? "") } });
  }

  /**
   * Lists chat rooms a page at a time.
   */
  async listChatRooms(req: chatChatRoomServiceApi.ListChatRoomsRequest): Promise<chatChatRoomServiceApi.ListChatRoomsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChatRooms", req);
    this.logger.info("list_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentServiceApi.WatchDocumentsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const stream1 = this.documentsDocumentClient.watchDocuments(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? documentsDocumentServiceApi.WatchDocumentsResponse.fromPartial({});
    const request2 = personalizationAffinityCalculationServiceApi.CalculateAffinityRequest.fromPartial({
      affinity: {
        occurredAt: req?.filter?.createdAfter,
        source: (req?.filter?.ownerId ?? ""),
      },
      annotations: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke2: Unary<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.calculateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatRoomServiceApi.ListChatRoomsResponse.fromPartial({ result: { correlationId: (reply2?.affinity?.correlationId ?? "") } });
  }

  /**
   * Lists chat rooms a page at a time.
   */
  async searchChatRooms(req: chatChatRoomServiceApi.SearchChatRoomsRequest): Promise<chatChatRoomServiceApi.SearchChatRoomsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchChatRooms", req);
    this.logger.info("search_chat_rooms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.CountProfilesRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
    });
    const invoke1: Unary<personalizationProfileQueryServiceApi.CountProfilesRequest, personalizationProfileQueryServiceApi.CountProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.countProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatRoomServiceApi.SearchChatRoomsResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        message: (reply1?.result?.message ?? ""),
      },
    });
  }

  /**
   * Changes a chat room.
   */
  async updateChatRoom(req: chatChatRoomServiceApi.UpdateChatRoomRequest): Promise<chatChatRoomServiceApi.UpdateChatRoomResponse> {
    validateContext(req.context);
    if (req.chatRoom) {
      await this.repository.save(toChatRoomRecord(req.context.tenantId, req.chatRoom));
    }
    await this.repository.record(req.context.tenantId, "UpdateChatRoom", req);
    this.logger.info("update_chat_room", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotValidationServiceApi.ScoreChatBotRequest.fromPartial({
      chatBot: { audit: { updatedBy: (req?.chatRoom?.audit?.updatedBy ?? "") } },
      context: req?.context,
    });
    const method1 = "scoreChatBot" as const;
    const invoke1: Unary<chatChatBotValidationServiceApi.ScoreChatBotRequest, chatChatBotValidationServiceApi.ScoreChatBotResponse> =
      (input, done) => this.chatChatBotValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotValidationServiceApi.ScoreChatBotRequest, chatChatBotValidationServiceApi.ScoreChatBotResponse>(invoke1, request1);
    const request2 = chatChatRoomValidationServiceApi.PreviewChatRoomRequest.fromPartial({
      chatRoom: { audit: { createdBy: (req?.chatRoom?.audit?.createdBy ?? "") } },
      context: req?.context,
      details: { contact: { email: (req?.chatRoom?.owner?.email ?? "") } },
    });
    const proxy2 = forwarding(this.chatChatRoomValidationClient);
    const invoke2: Unary<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse> =
      (input, done) => proxy2.previewChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (reply1?.chatBot?.action?.$case) {
      case "block":
        selected3_1 = ((reply1?.chatBot?.action?.$case === "block" ? reply1?.chatBot?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = chatChatBotQueryServiceApi.SummarizeChatBotsRequest.fromPartial({
      chatBotId: (reply1?.chatBot?.chatBotId ?? ""),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply2?.chatRoom?.specs ?? {}))),
        period: reply1?.chatBot?.effective,
      },
      reason: (selected3_1 ?? ""),
    });
    const invoke3: Unary<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse> =
      (input, done) => this.chatChatBotQueryClient.summarizeChatBots(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatChatBotQueryServiceApi.SummarizeChatBotsRequest, chatChatBotQueryServiceApi.SummarizeChatBotsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.chatRoom?.audit?.etag ?? "") });
    return mergeResponses(
      chatChatRoomServiceApi.UpdateChatRoomResponse.fromPartial({
        chatRoom: { owner: { email: (reply1?.chatBot?.owner?.email ?? "") } },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      chatChatRoomServiceApi.UpdateChatRoomResponse.fromPartial({ chatRoom: { name: (reply2?.chatRoom?.name ?? "") } }),
      chatChatRoomServiceApi.UpdateChatRoomResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      chatChatRoomServiceApi.UpdateChatRoomResponse.fromPartial({
        chatRoom: {
          chatRoomId: (req?.chatRoom?.chatRoomId ?? ""),
          code: (req?.chatRoom?.code ?? ""),
        },
      }),
    );
  }
}
