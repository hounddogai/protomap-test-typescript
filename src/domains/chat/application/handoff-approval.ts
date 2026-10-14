/**
 * Routes handoffs through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as chatChatBotApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as chatChatBotCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatBotLifecycleServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as chatHandoffApprovalServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as chatHandoffLifecycleServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_lifecycle_service.js";
import * as chatHandoffSyncServiceApi from "../../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as keymanagementCryptoKeyCalculationServiceApi from "../../../../.cache/proto/acme/keymanagement/v1/crypto_key_calculation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import * as webhooksWebhookSecretWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_workflow_service.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toHandoffRecord } from "../data/records.js";
import { ChatRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate handoff operations and persist audit data.
 */
@injectable()
export class HandoffApprovalWorkflow {
  constructor(
    @inject(ChatRepository) private readonly repository: ChatRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotApprovalService") private readonly chatChatBotApprovalClient: chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotCalculationService") private readonly chatChatBotCalculationClient: chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotLifecycleService") private readonly chatChatBotLifecycleClient: chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomApprovalService") private readonly chatChatRoomApprovalClient: chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient,
    @inject("grpc:acme.chat.v1.HandoffLifecycleService") private readonly chatHandoffLifecycleClient: chatHandoffLifecycleServiceApi.HandoffLifecycleServiceClient,
    @inject("grpc:acme.chat.v1.HandoffSyncService") private readonly chatHandoffSyncClient: chatHandoffSyncServiceApi.HandoffSyncServiceClient,
    @inject("grpc:acme.keymanagement.v1.CryptoKeyCalculationService") private readonly keymanagementCryptoKeyCalculationClient: keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationApprovalService") private readonly personalizationRecommendationApprovalClient: personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretWorkflowService") private readonly webhooksWebhookSecretWorkflowClient: webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a handoff.
   */
  async approveHandoff(req: chatHandoffApprovalServiceApi.ApproveHandoffRequest): Promise<chatHandoffApprovalServiceApi.ApproveHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "ApproveHandoff", req);
    this.logger.info("approve_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotCalculationServiceApi.QuoteChatBotRequest.fromPartial({
      chatBot: {
        audit: {
          createdAt: req?.handoff?.audit?.createdAt,
          updatedBy: (req?.handoff?.audit?.updatedBy ?? ""),
        },
        action: { $case: "block", block: { notifyEmail: (req?.details?.approver?.email ?? "") } },
        owner: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
      context: req?.context,
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<chatChatBotCalculationServiceApi.QuoteChatBotRequest, chatChatBotCalculationServiceApi.QuoteChatBotResponse> =
      (input, done) => this.chatChatBotCalculationClient.quoteChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotCalculationServiceApi.QuoteChatBotRequest, chatChatBotCalculationServiceApi.QuoteChatBotResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest.fromPartial({
      context: input2?.context,
      deliveryAttempt: {
        subject: {
          displayName: ((input2?.handoff?.origin?.$case === "customer" ? input2?.handoff?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient.retryDeliveryAttemptExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse>(invoke2, request2);
    const request3 = chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryRequest.fromPartial({
      context: req?.context,
      handoff: { audit: { createdAt: reply1?.chatBot?.audit?.createdAt } },
    });
    const cloned3: chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryRequest, chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryResponse> =
      (input, done) => this.chatHandoffLifecycleClient.scheduleHandoffExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryRequest, chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryResponse>(invoke3, cloned3);
    const request4 = chatChatBotValidationServiceApi.NormalizeChatBotRequest.fromPartial({
      chatBot: {
        audit: {
          createdBy: (req?.handoff?.audit?.createdBy ?? ""),
          updatedBy: (reply3?.handoff?.audit?.updatedBy ?? ""),
        },
      },
      context: req?.context,
    });
    const decoded4 = chatChatBotValidationServiceApi.NormalizeChatBotRequest.fromJSON(
      JSON.parse(JSON.stringify(chatChatBotValidationServiceApi.NormalizeChatBotRequest.toJSON(request4))),
    );
    const invoke4: Unary<chatChatBotValidationServiceApi.NormalizeChatBotRequest, chatChatBotValidationServiceApi.NormalizeChatBotResponse> =
      (input, done) => this.chatChatBotValidationClient.normalizeChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<chatChatBotValidationServiceApi.NormalizeChatBotRequest, chatChatBotValidationServiceApi.NormalizeChatBotResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffApprovalServiceApi.ApproveHandoffResponse.fromPartial({ handoff: { audit: { etag: (reply1?.chatBot?.audit?.etag ?? "") } } }),
      chatHandoffApprovalServiceApi.ApproveHandoffResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      chatHandoffApprovalServiceApi.ApproveHandoffResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      chatHandoffApprovalServiceApi.ApproveHandoffResponse.fromPartial({
        handoff: { audit: { updatedBy: (reply4?.chatBot?.audit?.updatedBy ?? "") } },
      }),
      chatHandoffApprovalServiceApi.ApproveHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          status: req?.handoff?.status,
        },
      }),
    );
  }

  /**
   * Comments a handoff.
   */
  async commentHandoffApproval(req: chatHandoffApprovalServiceApi.CommentHandoffApprovalRequest): Promise<chatHandoffApprovalServiceApi.CommentHandoffApprovalResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "CommentHandoffApproval", req);
    this.logger.info("comment_handoff_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest.fromPartial({
      context: req?.context,
      webhookSecret: {
        contact: { phone: (req?.handoff?.requester?.phone ?? "") },
        holder: {
          code: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.code ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.webhooks.v1.RetryWebhookSecretWorkflowRequest",
      value: Buffer.from(webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest.encode(request1).finish()),
    });
    const unpacked1 = webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest.decode(envelope1.value);
    const invoke1: Unary<webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowResponse> =
      (input, done) => this.webhooksWebhookSecretWorkflowClient.retryWebhookSecretWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffApprovalServiceApi.CommentHandoffApprovalResponse.fromPartial({
        handoff: { audit: { createdBy: (reply1?.webhookSecret?.audit?.createdBy ?? "") } },
      }),
      chatHandoffApprovalServiceApi.CommentHandoffApprovalResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          requester: req?.handoff?.requester,
        },
      }),
    );
  }

  /**
   * Escalates a handoff.
   */
  async escalateHandoff(req: chatHandoffApprovalServiceApi.EscalateHandoffRequest): Promise<chatHandoffApprovalServiceApi.EscalateHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "EscalateHandoff", req);
    this.logger.info("escalate_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.handoff?.origin?.$case) {
      case "customer":
        selected1_1 = ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected1_1 = "";
    }
    const request1 = metricsMetricSeriesServiceApi.CloneMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        audit: { etag: (req?.handoff?.audit?.etag ?? "") },
        owner: {
          displayName: (selected1_1 ?? ""),
          email: (req?.handoff?.assignee?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesClient.cloneMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffApprovalServiceApi.EscalateHandoffResponse.fromPartial({
        handoff: { requester: { email: (reply1?.metricSeries?.owner?.email ?? "") } },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      chatHandoffApprovalServiceApi.EscalateHandoffResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists handoffs a page at a time.
   */
  async listPendingHandoffs(req: chatHandoffApprovalServiceApi.ListPendingHandoffsRequest): Promise<chatHandoffApprovalServiceApi.ListPendingHandoffsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingHandoffs", req);
    this.logger.info("list_pending_handoffs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatRoomApprovalServiceApi.SubmitChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<chatChatRoomApprovalServiceApi.SubmitChatRoomRequest, chatChatRoomApprovalServiceApi.SubmitChatRoomResponse> =
      (input, done) => this.chatChatRoomApprovalClient.submitChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<chatChatRoomApprovalServiceApi.SubmitChatRoomRequest, chatChatRoomApprovalServiceApi.SubmitChatRoomResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return chatHandoffApprovalServiceApi.ListPendingHandoffsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } });
  }

  /**
   * Recalls a handoff.
   */
  async recallHandoff(req: chatHandoffApprovalServiceApi.RecallHandoffRequest): Promise<chatHandoffApprovalServiceApi.RecallHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "RecallHandoff", req);
    this.logger.info("recall_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationApprovalServiceApi.RejectRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.handoff?.requester?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      recommendation: {
        audit: {
          updatedAt: req?.handoff?.audit?.updatedAt,
          updatedBy: (req?.handoff?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationRecommendationApprovalServiceApi.RejectRecommendationRequest, personalizationRecommendationApprovalServiceApi.RejectRecommendationResponse> =
      (input, done) => this.personalizationRecommendationApprovalClient.rejectRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<personalizationRecommendationApprovalServiceApi.RejectRecommendationRequest, personalizationRecommendationApprovalServiceApi.RejectRecommendationResponse>(invoke1, request1));
    const request2 = chatHandoffSyncServiceApi.ListHandoffConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.recommendation?.audit?.updatedAt,
        ownerId: (reply1?.recommendation?.counterparty?.profileId ?? ""),
        region: (reply1?.recommendation?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<chatHandoffSyncServiceApi.ListHandoffConflictsRequest, chatHandoffSyncServiceApi.ListHandoffConflictsResponse> =
      (input, done) => this.chatHandoffSyncClient.listHandoffConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("RecallHandoff.ListHandoffConflicts", () => call<chatHandoffSyncServiceApi.ListHandoffConflictsRequest, chatHandoffSyncServiceApi.ListHandoffConflictsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffApprovalServiceApi.RecallHandoffResponse.fromPartial({
        outcome: {
          effectiveAt: reply1?.outcome?.effectiveAt,
          nextSteps: (reply1?.outcome?.nextSteps ?? []),
        },
      }),
      chatHandoffApprovalServiceApi.RecallHandoffResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      chatHandoffApprovalServiceApi.RecallHandoffResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a handoff.
   */
  async rejectHandoff(req: chatHandoffApprovalServiceApi.RejectHandoffRequest): Promise<chatHandoffApprovalServiceApi.RejectHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "RejectHandoff", req);
    this.logger.info("reject_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatHandoffLifecycleServiceApi.GetHandoffLifecycleRequest.fromPartial({
      context: req?.context,
      handoffId: (req?.handoff?.handoffId ?? ""),
    });
    const invoke1: Unary<chatHandoffLifecycleServiceApi.GetHandoffLifecycleRequest, chatHandoffLifecycleServiceApi.GetHandoffLifecycleResponse> =
      (input, done) => this.chatHandoffLifecycleClient.getHandoffLifecycle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = chatChatBotApprovalServiceApi.RecallChatBotRequest.fromPartial({
      chatBot: {
        owner: {
          email: (reply1?.handoff?.assignee?.email ?? ""),
          userId: (reply1?.handoff?.assignee?.userId ?? ""),
        },
      },
      context: req?.context,
      details: {
        approver: {
          displayName: ((req?.handoff?.origin?.$case === "customer" ? req?.handoff?.origin.customer : undefined)?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<chatChatBotApprovalServiceApi.RecallChatBotRequest, chatChatBotApprovalServiceApi.RecallChatBotResponse>(
      "acme.chat.v1.HandoffApprovalService/RejectHandoff:1", request2,
    );
    const request3 = keymanagementCryptoKeyCalculationServiceApi.CalculateCryptoKeyRequest.fromPartial({
      context: req?.context,
      cryptoKey: {
        audit: { updatedBy: (req?.handoff?.audit?.updatedBy ?? "") },
        holder: { displayName: (reply2?.chatBot?.owner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<keymanagementCryptoKeyCalculationServiceApi.CalculateCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.CalculateCryptoKeyResponse> =
      (input, done) => this.keymanagementCryptoKeyCalculationClient.calculateCryptoKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<keymanagementCryptoKeyCalculationServiceApi.CalculateCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.CalculateCryptoKeyResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffApprovalServiceApi.RejectHandoffResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      chatHandoffApprovalServiceApi.RejectHandoffResponse.fromPartial({ outcome: { status: (reply2?.result?.status ?? "") } }),
      chatHandoffApprovalServiceApi.RejectHandoffResponse.fromPartial({ outcome: { message: (reply3?.result?.message ?? "") } }),
      chatHandoffApprovalServiceApi.RejectHandoffResponse.fromPartial({
        handoff: {
          handoffId: (req?.handoffId ?? ""),
          priority: (req?.handoff?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Submits a handoff.
   */
  async submitHandoff(req: chatHandoffApprovalServiceApi.SubmitHandoffRequest): Promise<chatHandoffApprovalServiceApi.SubmitHandoffResponse> {
    validateContext(req.context);
    if (req.handoff) {
      await this.repository.save(toHandoffRecord(req.context.tenantId, req.handoff));
    }
    await this.repository.record(req.context.tenantId, "SubmitHandoff", req);
    this.logger.info("submit_handoff", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          name: req?.handoff?.requester?.name,
          phone: (req?.handoff?.requester?.phone ?? ""),
        },
      },
      webhookSecret: {
        contact: { preferredChannel: (req?.handoff?.requester?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowResponse> =
      (input, done) => this.webhooksWebhookSecretWorkflowClient.retryWebhookSecretWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<webhooksWebhookSecretWorkflowServiceApi.RetryWebhookSecretWorkflowResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest.fromPartial({
      chatBot: { audit: { updatedAt: req?.handoff?.audit?.updatedAt } },
      context: req?.context,
    });
    const invoke2: Unary<chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryRequest, chatChatBotLifecycleServiceApi.ScheduleChatBotExpiryResponse> =
      (input, done) => this.chatChatBotLifecycleClient.scheduleChatBotExpiry(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      chatHandoffApprovalServiceApi.SubmitHandoffResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      chatHandoffApprovalServiceApi.SubmitHandoffResponse.fromPartial({
        handoff: { assignee: { userId: (reply2?.chatBot?.owner?.userId ?? "") } },
      }),
      chatHandoffApprovalServiceApi.SubmitHandoffResponse.fromPartial({
        handoff: {
          customFields: (req?.handoff?.customFields ?? {}),
          handoffId: (req?.handoffId ?? ""),
        },
      }),
    );
  }
}
