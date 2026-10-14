/**
 * Builds and schedules reports about chat messages. Remote work stays behind typed client ports.
 */

import * as chatHandoffReportingServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as messagingChatMessageReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_reporting_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingConversationReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as secretsSecretQueryServiceApi from "../../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as venuesVenueValidationServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat message operations and persist audit data.
 */
@injectable()
export class ChatMessageReportingWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.HandoffReportingService") private readonly chatHandoffReportingClient: chatHandoffReportingServiceApi.HandoffReportingServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationReportingService") private readonly messagingConversationReportingClient: messagingConversationReportingServiceApi.ConversationReportingServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileLifecycleService") private readonly personalizationProfileLifecycleClient: personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient,
    @inject("grpc:acme.secrets.v1.SecretQueryService") private readonly secretsSecretQueryClient: secretsSecretQueryServiceApi.SecretQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("grpc:acme.venues.v1.VenueValidationService") private readonly venuesVenueValidationClient: venuesVenueValidationServiceApi.VenueValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Deletes a chat message.
   */
  async deleteChatMessageReport(req: messagingChatMessageReportingServiceApi.DeleteChatMessageReportRequest): Promise<messagingChatMessageReportingServiceApi.DeleteChatMessageReportResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteChatMessageReport", req);
    this.logger.info("delete_chat_message_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffReportingServiceApi.ListHandoffReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.chatMessageId ?? ""),
      },
    });
    const invoke1: Unary<chatHandoffReportingServiceApi.ListHandoffReportsRequest, chatHandoffReportingServiceApi.ListHandoffReportsResponse> =
      (input, done) => this.chatHandoffReportingClient.listHandoffReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalRequest.fromPartial({
      context: req?.context,
      surveyResponse: { correlationId: (reply1?.result?.correlationId ?? "") },
    });
    const method2 = "commentSurveyResponseApproval" as const;
    const invoke2: Unary<surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalRequest, surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse> =
      (input, done) => this.surveysSurveyResponseApprovalClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalRequest, surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return mergeResponses(
      messagingChatMessageReportingServiceApi.DeleteChatMessageReportResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      messagingChatMessageReportingServiceApi.DeleteChatMessageReportResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
    );
  }

  /**
   * Returns a chat message.
   */
  async fetchChatMessageReport(req: messagingChatMessageReportingServiceApi.FetchChatMessageReportRequest): Promise<messagingChatMessageReportingServiceApi.FetchChatMessageReportResponse> {
    validateContext(req.context);
    if (!req.chatMessageId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "chat_message_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchChatMessageReport", req);
    this.logger.info("fetch_chat_message_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingChatMessageReportingServiceApi.FetchChatMessageReportResponse.fromPartial({ chatMessage: { chatMessageId: (req?.chatMessageId ?? "") } });
  }

  /**
   * Generates a chat message.
   */
  async generateChatMessageReport(req: messagingChatMessageReportingServiceApi.GenerateChatMessageReportRequest): Promise<messagingChatMessageReportingServiceApi.GenerateChatMessageReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateChatMessageReport", req);
    this.logger.info("generate_chat_message_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      reason: (req?.reason ?? ""),
    });
    const proxy1 = forwarding(this.ledgerLedgerAccountValidationClient);
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest, ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityResponse> =
      (input, done) => proxy1.checkLedgerAccountEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest, ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityResponse>(invoke1, request1);
    const request2 = personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          name: reply1?.ledgerAccount?.contact?.name,
          phone: (reply1?.ledgerAccount?.contact?.phone ?? ""),
        },
      },
      profile: {
        audit: { createdBy: (reply1?.ledgerAccount?.audit?.createdBy ?? "") },
        relationshipManager: { email: (reply1?.ledgerAccount?.contact?.email ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest, personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse> =
      (input, done) => this.personalizationProfileLifecycleClient.scheduleProfileExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest, personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse>(invoke2, request2);
    const request3 = secretsSecretQueryServiceApi.CountSecretsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((reply1?.ledgerAccount?.labels ?? {}))),
        region: (reply2?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<secretsSecretQueryServiceApi.CountSecretsRequest, secretsSecretQueryServiceApi.CountSecretsResponse> =
      (input, done) => this.secretsSecretQueryClient.countSecrets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<secretsSecretQueryServiceApi.CountSecretsRequest, secretsSecretQueryServiceApi.CountSecretsResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      messagingChatMessageReportingServiceApi.GenerateChatMessageReportResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      messagingChatMessageReportingServiceApi.GenerateChatMessageReportResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      messagingChatMessageReportingServiceApi.GenerateChatMessageReportResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      messagingChatMessageReportingServiceApi.GenerateChatMessageReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists chat messages a page at a time.
   */
  async listChatMessageReports(req: messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest): Promise<messagingChatMessageReportingServiceApi.ListChatMessageReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChatMessageReports", req);
    this.logger.info("list_chat_message_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return messagingChatMessageReportingServiceApi.ListChatMessageReportsResponse.fromPartial({});
  }

  /**
   * Shares a chat message.
   */
  async shareChatMessageReport(req: messagingChatMessageReportingServiceApi.ShareChatMessageReportRequest): Promise<messagingChatMessageReportingServiceApi.ShareChatMessageReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareChatMessageReport", req);
    this.logger.info("share_chat_message_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = localizationLocaleApprovalServiceApi.SubmitLocaleRequest.fromPartial({
      context: input1?.context,
      locale: { owner: { email: (input1?.details?.recipient?.email ?? "") } },
    });
    const invoke1: Unary<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.submitLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleApprovalServiceApi.SubmitLocaleRequest, localizationLocaleApprovalServiceApi.SubmitLocaleResponse>(invoke1, request1);
    const request2 = messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest.fromPartial({
      chatMessage: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (reply1?.locale?.owner?.displayName ?? "") },
      },
      context: req?.context,
    });
    const cloned2: messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse> =
      (input, done) => this.messagingChatMessageSyncClient.resolveChatMessageConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageReportingServiceApi.ShareChatMessageReportResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingChatMessageReportingServiceApi.ShareChatMessageReportResponse.fromPartial({
        chatMessage: { kind: (reply2?.chatMessage?.kind ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      messagingChatMessageReportingServiceApi.ShareChatMessageReportResponse.fromPartial({ chatMessage: { chatMessageId: (req?.chatMessageId ?? "") } }),
    );
  }

  /**
   * Streams the changes of chat messages as they happen.
   */
  async streamChatMessageMetrics(req: messagingChatMessageReportingServiceApi.StreamChatMessageMetricsRequest): Promise<messagingChatMessageReportingServiceApi.StreamChatMessageMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamChatMessageMetrics", req);
    this.logger.info("stream_chat_message_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingConversationReportingServiceApi.GenerateConversationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const decoded1 = messagingConversationReportingServiceApi.GenerateConversationReportRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingConversationReportingServiceApi.GenerateConversationReportRequest.toJSON(request1))),
    );
    const invoke1: Unary<messagingConversationReportingServiceApi.GenerateConversationReportRequest, messagingConversationReportingServiceApi.GenerateConversationReportResponse> =
      (input, done) => this.messagingConversationReportingClient.generateConversationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingConversationReportingServiceApi.GenerateConversationReportRequest, messagingConversationReportingServiceApi.GenerateConversationReportResponse>(invoke1, decoded1);
    const request2 = venuesVenueValidationServiceApi.NormalizeVenueRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.subscriber?.phone ?? "") } },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.venues.v1.NormalizeVenueRequest",
      value: Buffer.from(venuesVenueValidationServiceApi.NormalizeVenueRequest.encode(request2).finish()),
    });
    const unpacked2 = venuesVenueValidationServiceApi.NormalizeVenueRequest.decode(envelope2.value);
    const invoke2: Unary<venuesVenueValidationServiceApi.NormalizeVenueRequest, venuesVenueValidationServiceApi.NormalizeVenueResponse> =
      (input, done) => this.venuesVenueValidationClient.normalizeVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<venuesVenueValidationServiceApi.NormalizeVenueRequest, venuesVenueValidationServiceApi.NormalizeVenueResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      messagingChatMessageReportingServiceApi.StreamChatMessageMetricsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingChatMessageReportingServiceApi.StreamChatMessageMetricsResponse.fromPartial({
        chatMessage: { measurements: [{ unit: (reply2?.venue?.dimensions?.unit ?? "") }] },
        result: { status: (reply2?.result?.status ?? "") },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChatMessageReportingService; workflows own validation and database transactions.
 */
@injectable()
export class ChatMessageReportingHandler {
  constructor(@inject(ChatMessageReportingWorkflow) private readonly workflow: ChatMessageReportingWorkflow) {}

  /**
   * Deletes a chat message.
   */
  deleteChatMessageReport = unary<messagingChatMessageReportingServiceApi.DeleteChatMessageReportRequest, messagingChatMessageReportingServiceApi.DeleteChatMessageReportResponse>(
    (request) => this.workflow.deleteChatMessageReport(request),
  );

  /**
   * Returns a chat message.
   */
  fetchChatMessageReport = unary<messagingChatMessageReportingServiceApi.FetchChatMessageReportRequest, messagingChatMessageReportingServiceApi.FetchChatMessageReportResponse>(
    (request) => this.workflow.fetchChatMessageReport(request),
  );

  /**
   * Generates a chat message.
   */
  generateChatMessageReport = (call: ServerUnaryCall<messagingChatMessageReportingServiceApi.GenerateChatMessageReportRequest, messagingChatMessageReportingServiceApi.GenerateChatMessageReportResponse>, done: sendUnaryData<messagingChatMessageReportingServiceApi.GenerateChatMessageReportResponse>): void => {
    void this.workflow.generateChatMessageReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lists chat messages a page at a time.
   */
  listChatMessageReports = unary<messagingChatMessageReportingServiceApi.ListChatMessageReportsRequest, messagingChatMessageReportingServiceApi.ListChatMessageReportsResponse>(
    (request) => this.workflow.listChatMessageReports(request),
  );

  /**
   * Shares a chat message.
   */
  shareChatMessageReport = unary<messagingChatMessageReportingServiceApi.ShareChatMessageReportRequest, messagingChatMessageReportingServiceApi.ShareChatMessageReportResponse>(
    (request) => this.workflow.shareChatMessageReport(request),
  );

  /**
   * Streams the changes of chat messages as they happen.
   */
  streamChatMessageMetrics = serverStream<messagingChatMessageReportingServiceApi.StreamChatMessageMetricsRequest, messagingChatMessageReportingServiceApi.StreamChatMessageMetricsResponse>(
    (request) => this.workflow.streamChatMessageMetrics(request),
  );
}

export function implementation(handler: ChatMessageReportingHandler): messagingChatMessageReportingServiceApi.ChatMessageReportingServiceServer {
  return {
    deleteChatMessageReport: handler.deleteChatMessageReport,
    fetchChatMessageReport: handler.fetchChatMessageReport,
    generateChatMessageReport: handler.generateChatMessageReport,
    listChatMessageReports: handler.listChatMessageReports,
    shareChatMessageReport: handler.shareChatMessageReport,
    streamChatMessageMetrics: handler.streamChatMessageMetrics,
  };
}
