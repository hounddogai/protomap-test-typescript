/**
 * Builds and schedules reports about chat bots. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as chatChatBotCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatBotReportingServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as chatChatRoomQueryServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as chatChatRoomValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatHandoffCalculationServiceApi from "../../../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as contentArticleServiceApi from "../../../../../.cache/proto/acme/content/v1/article_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as webhooksWebhookEndpointApprovalServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_approval_service.js";
import * as workplacesBuildingCalculationServiceApi from "../../../../../.cache/proto/acme/workplaces/v1/building_calculation_service.js";
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
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { collect, upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { ChatRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat bot operations and persist audit data.
 */
@injectable()
export class ChatBotReportingWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomQueryService") private readonly chatChatRoomQueryClient: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomValidationService") private readonly chatChatRoomValidationClient: chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient,
    @inject("grpc:acme.chat.v1.HandoffCalculationService") private readonly chatHandoffCalculationClient: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient,
    @inject("grpc:acme.content.v1.ArticleService") private readonly contentArticleClient: contentArticleServiceApi.ArticleServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationExportService") private readonly notificationsNotificationExportClient: notificationsNotificationExportServiceApi.NotificationExportServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointApprovalService") private readonly webhooksWebhookEndpointApprovalClient: webhooksWebhookEndpointApprovalServiceApi.WebhookEndpointApprovalServiceClient,
    @inject("grpc:acme.workplaces.v1.BuildingCalculationService") private readonly workplacesBuildingCalculationClient: workplacesBuildingCalculationServiceApi.BuildingCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts chat bots by status.
   */
  async countChatBotTotals(req: chatChatBotReportingServiceApi.CountChatBotTotalsRequest): Promise<chatChatBotReportingServiceApi.CountChatBotTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountChatBotTotals", req);
    this.logger.info("count_chat_bot_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { measurements: [{ observedAt: req?.filter?.createdAfter }] },
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsRequest, notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.lintDeliveryAttempts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsRequest, notificationsDeliveryAttemptValidationServiceApi.LintDeliveryAttemptsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = chatChatRoomQueryServiceApi.ExportChatRoomsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
        region: (req?.filter?.region ?? ""),
      },
    });
    const stream2 = this.chatChatRoomQueryClient.exportChatRooms(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? chatChatRoomQueryServiceApi.ExportChatRoomsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatChatBotReportingServiceApi.CountChatBotTotalsResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        status: (reply1?.outcome?.status ?? ""),
      },
    });
  }

  /**
   * Deletes a chat bot.
   */
  async deleteChatBotReport(req: chatChatBotReportingServiceApi.DeleteChatBotReportRequest): Promise<chatChatBotReportingServiceApi.DeleteChatBotReportResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteChatBotReport", req);
    this.logger.info("delete_chat_bot_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = workplacesBuildingCalculationServiceApi.EstimateBuildingRequest.fromPartial({
      building: {
        audit: { etag: (req?.etag ?? "") },
        children: [{ manager: { email: (req?.context?.actor?.email ?? "") } }],
      },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<workplacesBuildingCalculationServiceApi.EstimateBuildingRequest, workplacesBuildingCalculationServiceApi.EstimateBuildingResponse> =
      (input, done) => this.workplacesBuildingCalculationClient.estimateBuilding(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<workplacesBuildingCalculationServiceApi.EstimateBuildingRequest, workplacesBuildingCalculationServiceApi.EstimateBuildingResponse>(invoke1, request1));
    const request2 = authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityRequest.fromPartial({
      accessPolicy: {
        audit: {
          etag: (req?.etag ?? ""),
          updatedAt: reply1?.building?.audit?.updatedAt,
        },
        action: { $case: "block", block: { notifyEmail: (reply1?.building?.manager?.email ?? "") } },
        owner: { userId: (reply1?.building?.manager?.userId ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityRequest, authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.checkAccessPolicyEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("DeleteChatBotReport.CheckAccessPolicyEligibility", () => call<authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityRequest, authorizationAccessPolicyValidationServiceApi.CheckAccessPolicyEligibilityResponse>(invoke2, request2));
    const request3 = ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.building?.location?.lines ?? []).map((value) => value),
        },
      },
      ledgerAccount: {
        audit: {
          createdAt: reply2?.accessPolicy?.audit?.createdAt,
          updatedAt: reply1?.building?.audit?.updatedAt,
        },
        limits: [{
          amount: (reply2?.accessPolicy?.action?.$case === "discount" ? reply2?.accessPolicy?.action.discount : undefined)?.amount,
        }],
      },
    });
    const invoke3: Unary<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.scoreLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest.fromPartial({
      chatRoom: { owner: { userId: (reply1?.building?.manager?.userId ?? "") } },
      context: req?.context,
      details: { contact: { email: (reply3?.ledgerAccount?.contact?.email ?? "") } },
    });
    const reply4 = await this.workQueue.enqueue<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse>(
      "acme.chat.v1.ChatBotReportingService/DeleteChatBotReport:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.chatBotId ?? "") });
    return mergeResponses(
      chatChatBotReportingServiceApi.DeleteChatBotReportResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      chatChatBotReportingServiceApi.DeleteChatBotReportResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      chatChatBotReportingServiceApi.DeleteChatBotReportResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      chatChatBotReportingServiceApi.DeleteChatBotReportResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          message: (reply4?.result?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a chat bot.
   */
  async fetchChatBotReport(req: chatChatBotReportingServiceApi.FetchChatBotReportRequest): Promise<chatChatBotReportingServiceApi.FetchChatBotReportResponse> {
    validateContext(req.context);
    if (!req.chatBotId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_bot_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchChatBotReport", req);
    this.logger.info("fetch_chat_bot_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    return chatChatBotReportingServiceApi.FetchChatBotReportResponse.fromPartial({ chatBot: { chatBotId: (req?.chatBotId ?? "") } });
  }

  /**
   * Generates a chat bot.
   */
  async generateChatBotReport(req: chatChatBotReportingServiceApi.GenerateChatBotReportRequest): Promise<chatChatBotReportingServiceApi.GenerateChatBotReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateChatBotReport", req);
    this.logger.info("generate_chat_bot_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.QuoteNotificationRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.quoteNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      chatChatBotReportingServiceApi.GenerateChatBotReportResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      chatChatBotReportingServiceApi.GenerateChatBotReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists chat bots a page at a time.
   */
  async listChatBotReports(req: chatChatBotReportingServiceApi.ListChatBotReportsRequest): Promise<chatChatBotReportingServiceApi.ListChatBotReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChatBotReports", req);
    this.logger.info("list_chat_bot_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffCalculationServiceApi.CalculateHandoffRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      handoff: {
        assignee: { email: (req?.context?.actor?.email ?? "") },
        audit: { createdAt: req?.filter?.createdAfter },
      },
    });
    const invoke1: Unary<chatHandoffCalculationServiceApi.CalculateHandoffRequest, chatHandoffCalculationServiceApi.CalculateHandoffResponse> =
      (input, done) => this.chatHandoffCalculationClient.calculateHandoff(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<chatHandoffCalculationServiceApi.CalculateHandoffResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = chatChatBotCalculationServiceApi.CalculateChatBotRequest.fromPartial({
      chatBot: {
        owner: { displayName: (reply1?.handoff?.assignee?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<chatChatBotCalculationServiceApi.CalculateChatBotRequest, chatChatBotCalculationServiceApi.CalculateChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.calculateChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      chatChatBotReportingServiceApi.ListChatBotReportsResponse.fromPartial({
        chatBots: [{
          audit: {
            createdBy: (reply1?.handoff?.audit?.createdBy ?? ""),
            updatedAt: reply1?.handoff?.audit?.updatedAt,
          },
        }],
      }),
      chatChatBotReportingServiceApi.ListChatBotReportsResponse.fromPartial({
        chatBots: [{
          name: (reply2?.chatBot?.name ?? ""),
          owner: reply2?.chatBot?.owner,
        }],
      }),
    );
  }

  /**
   * Schedules a chat bot.
   */
  async scheduleChatBotReport(req: chatChatBotReportingServiceApi.ScheduleChatBotReportRequest): Promise<chatChatBotReportingServiceApi.ScheduleChatBotReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleChatBotReport", req);
    this.logger.info("schedule_chat_bot_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ValidateLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.validateLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = chatChatBotCalculationServiceApi.ExplainChatBotCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          phone: (reply1?.ledgerAccount?.contact?.phone ?? ""),
          preferredChannel: (reply1?.ledgerAccount?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const method2 = "explainChatBotCalculation" as const;
    const invoke2: Unary<chatChatBotCalculationServiceApi.ExplainChatBotCalculationRequest, chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse> =
      (input, done) => this.chatChatBotCalculationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatBotCalculationServiceApi.ExplainChatBotCalculationRequest, chatChatBotCalculationServiceApi.ExplainChatBotCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotReportingServiceApi.ScheduleChatBotReportResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.outcome?.message ?? ""),
        },
      }),
      chatChatBotReportingServiceApi.ScheduleChatBotReportResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      chatChatBotReportingServiceApi.ScheduleChatBotReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a chat bot.
   */
  async shareChatBotReport(req: chatChatBotReportingServiceApi.ShareChatBotReportRequest): Promise<chatChatBotReportingServiceApi.ShareChatBotReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareChatBotReport", req);
    this.logger.info("share_chat_bot_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        contact: {
          name: req?.details?.recipient?.name,
          phone: (req?.details?.recipient?.phone ?? ""),
          preferredChannel: (req?.details?.recipient?.preferredChannel ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.ledgerLedgerAccountClient);
    const invoke1: Unary<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse> =
      (input, done) => proxy1.createLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse>(invoke1, request1);
    const request2 = chatChatRoomValidationServiceApi.LintChatRoomsRequest.fromPartial({
      chatRoom: { audit: { createdBy: (reply1?.ledgerAccount?.audit?.createdBy ?? "") } },
      context: req?.context,
      details: { contact: { name: reply1?.ledgerAccount?.contact?.name } },
    });
    const invoke2: Unary<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse> =
      (input, done) => this.chatChatRoomValidationClient.lintChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse>(invoke2, request2);
    const request3 = contentArticleServiceApi.BatchCreateArticlesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.chatBotId ?? ""),
        submittedBy: req?.details?.recipient,
      } },
    });
    const reply3 = await upload<contentArticleServiceApi.BatchCreateArticlesRequest, contentArticleServiceApi.BatchCreateArticlesResponse>(
      (done) => this.contentArticleClient.batchCreateArticles(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatChatBotReportingServiceApi.ShareChatBotReportResponse.fromPartial({
        chatBot: { audit: { updatedAt: reply1?.ledgerAccount?.audit?.updatedAt } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      chatChatBotReportingServiceApi.ShareChatBotReportResponse.fromPartial({
        chatBot: { owner: { email: (reply2?.chatRoom?.owner?.email ?? "") } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      chatChatBotReportingServiceApi.ShareChatBotReportResponse.fromPartial({ chatBot: { chatBotId: (req?.chatBotId ?? "") } }),
    );
  }

  /**
   * Streams the changes of chat bots as they happen.
   */
  async streamChatBotMetrics(req: chatChatBotReportingServiceApi.StreamChatBotMetricsRequest): Promise<chatChatBotReportingServiceApi.StreamChatBotMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamChatBotMetrics", req);
    this.logger.info("stream_chat_bot_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomValidationServiceApi.ValidateChatRoomRequest.fromPartial({
      chatRoom: { owner: { email: (req?.subscriber?.email ?? "") } },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse> =
      (input, done) => this.chatChatRoomValidationClient.validateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomValidationServiceApi.ValidateChatRoomRequest, chatChatRoomValidationServiceApi.ValidateChatRoomResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsNotificationExportServiceApi.RetryNotificationExportRequest.fromPartial({
      context: input2?.context,
      notification: {
        comments: [{ createdAt: reply1?.chatRoom?.audit?.createdAt }],
        origin: { $case: "customer", customer: { displayName: (reply1?.chatRoom?.owner?.displayName ?? "") } },
      },
    });
    const invoke2: Unary<notificationsNotificationExportServiceApi.RetryNotificationExportRequest, notificationsNotificationExportServiceApi.RetryNotificationExportResponse> =
      (input, done) => this.notificationsNotificationExportClient.retryNotificationExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationExportServiceApi.RetryNotificationExportRequest, notificationsNotificationExportServiceApi.RetryNotificationExportResponse>(invoke2, request2);
    let selected3_1: string | undefined;
    switch (reply1?.chatRoom?.locator?.$case) {
      case "address":
        selected3_1 = ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = chatHandoffCalculationServiceApi.RecalculateHandoffsRequest.fromPartial({
      context: req?.context,
      details: { destination: { recipient: (selected3_1 ?? "") } },
      handoff: {
        audit: {
          createdBy: (reply2?.notification?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.chatRoom?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke3: Unary<chatHandoffCalculationServiceApi.RecalculateHandoffsRequest, chatHandoffCalculationServiceApi.RecalculateHandoffsResponse> =
      (input, done) => this.chatHandoffCalculationClient.recalculateHandoffs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatHandoffCalculationServiceApi.RecalculateHandoffsRequest, chatHandoffCalculationServiceApi.RecalculateHandoffsResponse>(invoke3, request3);
    const request4 = webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
        region: ((reply1?.chatRoom?.locator?.$case === "address" ? reply1?.chatRoom?.locator.address : undefined)?.region ?? ""),
      },
    });
    const decoded4 = webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest.fromJSON(
      JSON.parse(JSON.stringify(webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest.toJSON(request4))),
    );
    const invoke4: Unary<webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest, webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointApprovalClient.listPendingWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsRequest, webhooksWebhookEndpointApprovalServiceApi.ListPendingWebhookEndpointsResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      chatChatBotReportingServiceApi.StreamChatBotMetricsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      chatChatBotReportingServiceApi.StreamChatBotMetricsResponse.fromPartial({
        chatBot: { owner: { userId: (reply2?.notification?.assignee?.userId ?? "") } },
      }),
      chatChatBotReportingServiceApi.StreamChatBotMetricsResponse.fromPartial({
        chatBot: { priority: (reply3?.handoff?.priority ?? 0) },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      chatChatBotReportingServiceApi.StreamChatBotMetricsResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      chatChatBotReportingServiceApi.StreamChatBotMetricsResponse.fromPartial({ chatBot: { owner: { email: (req?.subscriber?.email ?? "") } } }),
    );
  }
}
