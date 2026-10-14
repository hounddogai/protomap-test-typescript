/**
 * Runs the long-lived workflow that takes a chat message from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as experimentsExposureImportServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsVariantSyncServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import * as messagingChannelReportingServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import * as messagingChannelSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as messagingChatMessageApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingChatMessageWorkflowServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_workflow_service.js";
import * as messagingConversationApprovalServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_approval_service.js";
import * as messagingParticipantSyncServiceApi from "../../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../platform/rpc.js";
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toChatMessageRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate chat message operations and persist audit data.
 */
@injectable()
export class ChatMessageWorkflowWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExposureImportService") private readonly experimentsExposureImportClient: experimentsExposureImportServiceApi.ExposureImportServiceClient,
    @inject("grpc:acme.experiments.v1.VariantSyncService") private readonly experimentsVariantSyncClient: experimentsVariantSyncServiceApi.VariantSyncServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelLifecycleService") private readonly messagingChannelLifecycleClient: messagingChannelLifecycleServiceApi.ChannelLifecycleServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelReportingService") private readonly messagingChannelReportingClient: messagingChannelReportingServiceApi.ChannelReportingServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelSyncService") private readonly messagingChannelSyncClient: messagingChannelSyncServiceApi.ChannelSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageApprovalService") private readonly messagingChatMessageApprovalClient: messagingChatMessageApprovalServiceApi.ChatMessageApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageSyncService") private readonly messagingChatMessageSyncClient: messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationApprovalService") private readonly messagingConversationApprovalClient: messagingConversationApprovalServiceApi.ConversationApprovalServiceClient,
    @inject("grpc:acme.messaging.v1.ParticipantSyncService") private readonly messagingParticipantSyncClient: messagingParticipantSyncServiceApi.ParticipantSyncServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a chat message.
   */
  async advanceChatMessageWorkflow(req: messagingChatMessageWorkflowServiceApi.AdvanceChatMessageWorkflowRequest): Promise<messagingChatMessageWorkflowServiceApi.AdvanceChatMessageWorkflowResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "AdvanceChatMessageWorkflow", req);
    this.logger.info("advance_chat_message_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelSyncServiceApi.GetChannelSyncStateRequest.fromPartial({
      channelId: (req?.chatMessage?.subject?.channelId ?? ""),
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelSyncServiceApi.GetChannelSyncStateRequest, messagingChannelSyncServiceApi.GetChannelSyncStateResponse> =
      (input, done) => this.messagingChannelSyncClient.getChannelSyncState(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("AdvanceChatMessageWorkflow.GetChannelSyncState", () => call<messagingChannelSyncServiceApi.GetChannelSyncStateRequest, messagingChannelSyncServiceApi.GetChannelSyncStateResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageWorkflowServiceApi.AdvanceChatMessageWorkflowResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      messagingChatMessageWorkflowServiceApi.AdvanceChatMessageWorkflowResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          subject: req?.chatMessage?.subject,
        },
      }),
    );
  }

  /**
   * Cancels a chat message.
   */
  async cancelChatMessageWorkflow(req: messagingChatMessageWorkflowServiceApi.CancelChatMessageWorkflowRequest): Promise<messagingChatMessageWorkflowServiceApi.CancelChatMessageWorkflowResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "CancelChatMessageWorkflow", req);
    this.logger.info("cancel_chat_message_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelLifecycleServiceApi.RenewChannelRequest.fromPartial({
      channelId: (req?.chatMessage?.subject?.channelId ?? ""),
      context: req?.context,
      details: {
        newOwner: {
          displayName: (req?.chatMessage?.subject?.displayName ?? ""),
          email: (req?.details?.notify?.email ?? ""),
        },
        notifyContact: { name: req?.details?.notify?.name },
      },
    });
    const invoke1: Unary<messagingChannelLifecycleServiceApi.RenewChannelRequest, messagingChannelLifecycleServiceApi.RenewChannelResponse> =
      (input, done) => this.messagingChannelLifecycleClient.renewChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = messagingParticipantSyncServiceApi.ReconcileParticipantsRequest.fromPartial({
      context: req?.context,
      participant: {
        audit: { etag: (reply1?.channel?.audit?.etag ?? "") },
        primaryAddress: {
          locality: ((reply1?.channel?.locator?.$case === "address" ? reply1?.channel?.locator.address : undefined)?.locality ?? ""),
        },
      },
    });
    const reply2 = await this.workQueue.enqueue<messagingParticipantSyncServiceApi.ReconcileParticipantsRequest, messagingParticipantSyncServiceApi.ReconcileParticipantsResponse>(
      "acme.messaging.v1.ChatMessageWorkflowService/CancelChatMessageWorkflow:1", request2,
    );
    const request3 = experimentsExposureImportServiceApi.ImportExposuresRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.chatMessage?.source ?? ""),
        submittedBy: req?.details?.notify,
      } },
      sequence: (req?.chatMessage?.sequence ?? 0),
    });
    const reply3 = await upload<experimentsExposureImportServiceApi.ImportExposuresRequest, experimentsExposureImportServiceApi.ImportExposuresResponse>(
      (done) => this.experimentsExposureImportClient.importExposures(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageWorkflowServiceApi.CancelChatMessageWorkflowResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      messagingChatMessageWorkflowServiceApi.CancelChatMessageWorkflowResponse.fromPartial({
        outcome: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingChatMessageWorkflowServiceApi.CancelChatMessageWorkflowResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          subject: req?.chatMessage?.subject,
        },
      }),
    );
  }

  /**
   * Lists chat messages a page at a time.
   */
  async listChatMessageWorkflows(req: messagingChatMessageWorkflowServiceApi.ListChatMessageWorkflowsRequest): Promise<messagingChatMessageWorkflowServiceApi.ListChatMessageWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListChatMessageWorkflows", req);
    this.logger.info("list_chat_message_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelReportingServiceApi.ListChannelReportsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        query: (req?.filter?.query ?? ""),
      },
      page: {
        pageSize: (req?.page?.pageSize ?? 0),
        pageToken: (req?.page?.pageToken ?? ""),
      },
    });
    const invoke1: Unary<messagingChannelReportingServiceApi.ListChannelReportsRequest, messagingChannelReportingServiceApi.ListChannelReportsResponse> =
      (input, done) => this.messagingChannelReportingClient.listChannelReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<messagingChannelReportingServiceApi.ListChannelReportsRequest, messagingChannelReportingServiceApi.ListChannelReportsResponse>(invoke1, request1));
    const request2 = metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
      },
    });
    const invoke2: Unary<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.checkMetricSeriesEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = experimentsVariantSyncServiceApi.StreamVariantChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: { notifyEmail: (req?.context?.actor?.email ?? "") } },
        parameters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        scopes: (req?.context?.actor?.roles ?? []).map((value) => value),
      } },
      context: req?.context,
    });
    const stream3 = this.experimentsVariantSyncClient.streamVariantChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? experimentsVariantSyncServiceApi.StreamVariantChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      messagingChatMessageWorkflowServiceApi.ListChatMessageWorkflowsResponse.fromPartial({
        pageInfo: { totalSize: (reply1?.pageInfo?.totalSize ?? 0) },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingChatMessageWorkflowServiceApi.ListChatMessageWorkflowsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
    );
  }

  /**
   * Pauses a chat message.
   */
  async pauseChatMessageWorkflow(req: messagingChatMessageWorkflowServiceApi.PauseChatMessageWorkflowRequest): Promise<messagingChatMessageWorkflowServiceApi.PauseChatMessageWorkflowResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "PauseChatMessageWorkflow", req);
    this.logger.info("pause_chat_message_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse>> = [];
    for (const item of (req?.chatMessage?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest.fromPartial({
          chatMessage: { measurements: [{ value: (item?.value ?? 0) }] },
          context: req?.context,
        });
        const invoke1: Unary<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse> =
          (input, done) => this.messagingChatMessageApprovalClient.delegateChatMessageApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? messagingChatMessageApprovalServiceApi.DelegateChatMessageApprovalResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return messagingChatMessageWorkflowServiceApi.PauseChatMessageWorkflowResponse.fromPartial({
      chatMessage: {
        chatMessageId: (req?.chatMessageId ?? ""),
        kind: (req?.chatMessage?.kind ?? ""),
      },
    });
  }

  /**
   * Retrys a chat message.
   */
  async retryChatMessageWorkflow(req: messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowRequest): Promise<messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "RetryChatMessageWorkflow", req);
    this.logger.info("retry_chat_message_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChannelSyncServiceApi.GetChannelSyncStateRequest.fromPartial({
      channelId: (req?.chatMessage?.subject?.channelId ?? ""),
      context: req?.context,
    });
    const invoke1: Unary<messagingChannelSyncServiceApi.GetChannelSyncStateRequest, messagingChannelSyncServiceApi.GetChannelSyncStateResponse> =
      (input, done) => this.messagingChannelSyncClient.getChannelSyncState(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notify?.phone ?? "") } },
      searchIndex: {
        audit: { updatedBy: (reply1?.channel?.audit?.updatedBy ?? "") },
        components: { primary: {
          componentId: (reply1?.channel?.components?.["primary"]?.componentId ?? ""),
          description: (reply1?.channel?.components?.["primary"]?.description ?? ""),
        } },
      },
    });
    const invoke2: Unary<searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest, searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionResponse> =
      (input, done) => this.searchSearchIndexValidationClient.explainSearchIndexDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowResponse.fromPartial({
        chatMessage: { measurements: [{ unit: (reply1?.channel?.dimensions?.unit ?? "") }] },
      }),
      messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowResponse.fromPartial({
        outcome: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowResponse.fromPartial({
        chatMessage: { chatMessageId: (req?.chatMessageId ?? "") },
        result: { correlationId: (req?.chatMessage?.correlationId ?? "") },
      }),
    );
  }

  /**
   * Signals a chat message.
   */
  async signalChatMessageWorkflow(req: messagingChatMessageWorkflowServiceApi.SignalChatMessageWorkflowRequest): Promise<messagingChatMessageWorkflowServiceApi.SignalChatMessageWorkflowResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "SignalChatMessageWorkflow", req);
    this.logger.info("signal_chat_message_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.chatMessage?.measurements ?? []).map(async (item) => {
      const request1 = featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagRequest.fromPartial({
        context: req?.context,
        featureFlag: {
          audit: { createdAt: item?.observedAt },
          owner: {
            displayName: (req?.chatMessage?.subject?.displayName ?? ""),
            email: (req?.details?.notify?.email ?? ""),
          },
        },
      });
      const invoke1: Unary<featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagResponse> =
        (input, done) => this.featureflagsFeatureFlagValidationClient.scoreFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagRequest, featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? featureflagsFeatureFlagValidationServiceApi.ScoreFeatureFlagResponse.fromPartial({});
    const request2 = messagingConversationApprovalServiceApi.ApproveConversationRequest.fromPartial({
      context: req?.context,
      conversation: { audit: { createdBy: (reply1?.featureFlag?.audit?.createdBy ?? "") } },
    });
    const method2 = "approveConversation" as const;
    const invoke2: Unary<messagingConversationApprovalServiceApi.ApproveConversationRequest, messagingConversationApprovalServiceApi.ApproveConversationResponse> =
      (input, done) => this.messagingConversationApprovalClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationApprovalServiceApi.ApproveConversationRequest, messagingConversationApprovalServiceApi.ApproveConversationResponse>(invoke2, request2);
    const request3 = personalizationRecommendationSyncServiceApi.StreamRecommendationChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        counterparty: {
          displayName: (req?.chatMessage?.subject?.displayName ?? ""),
          email: (req?.context?.actor?.email ?? ""),
        },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.chatMessage?.attributes ?? {}))),
        }],
      } },
      context: req?.context,
    });
    const stream3 = this.personalizationRecommendationSyncClient.streamRecommendationChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? personalizationRecommendationSyncServiceApi.StreamRecommendationChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageWorkflowServiceApi.SignalChatMessageWorkflowResponse.fromPartial({
        chatMessage: {
          subject: {
            displayName: ((reply2?.conversation?.origin?.$case === "customer" ? reply2?.conversation?.origin.customer : undefined)?.displayName ?? ""),
          },
        },
        outcome: { status: (reply2?.outcome?.status ?? "") },
      }),
      messagingChatMessageWorkflowServiceApi.SignalChatMessageWorkflowResponse.fromPartial({
        chatMessage: {
          chatMessageId: (req?.chatMessageId ?? ""),
          sequence: (req?.chatMessage?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Starts a chat message.
   */
  async startChatMessageWorkflow(req: messagingChatMessageWorkflowServiceApi.StartChatMessageWorkflowRequest): Promise<messagingChatMessageWorkflowServiceApi.StartChatMessageWorkflowResponse> {
    validateContext(req.context);
    if (req.chatMessage) {
      await this.repository.save(toChatMessageRecord(req.context.tenantId, req.chatMessage));
    }
    await this.repository.record(req.context.tenantId, "StartChatMessageWorkflow", req);
    this.logger.info("start_chat_message_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: (req?.chatMessage?.subject?.channelId ?? ""),
          code: (req?.chatMessage?.subject?.code ?? ""),
          displayName: (req?.chatMessage?.subject?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: { approver: { email: (req?.details?.notify?.email ?? "") } },
    });
    const proxy1 = forwarding(this.messagingChatMessageApprovalClient);
    const invoke1: Unary<messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalResponse> =
      (input, done) => proxy1.commentChatMessageApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalRequest, messagingChatMessageApprovalServiceApi.CommentChatMessageApprovalResponse>(invoke1, request1);
    const request2 = messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest.fromPartial({
      chatMessage: {
        subject: {
          channelId: (req?.chatMessage?.subject?.channelId ?? ""),
          displayName: (reply1?.chatMessage?.subject?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse> =
      (input, done) => this.messagingChatMessageSyncClient.reconcileChatMessages(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageSyncServiceApi.ReconcileChatMessagesRequest, messagingChatMessageSyncServiceApi.ReconcileChatMessagesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingChatMessageWorkflowServiceApi.StartChatMessageWorkflowResponse.fromPartial({
        chatMessage: { correlationId: (reply1?.chatMessage?.correlationId ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      messagingChatMessageWorkflowServiceApi.StartChatMessageWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      messagingChatMessageWorkflowServiceApi.StartChatMessageWorkflowResponse.fromPartial({
        chatMessage: {
          attributes: (req?.chatMessage?.attributes ?? {}),
          chatMessageId: (req?.chatMessageId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ChatMessageWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ChatMessageWorkflowHandler {
  constructor(@inject(ChatMessageWorkflowWorkflow) private readonly workflow: ChatMessageWorkflowWorkflow) {}

  /**
   * Advances a chat message.
   */
  advanceChatMessageWorkflow = unary<messagingChatMessageWorkflowServiceApi.AdvanceChatMessageWorkflowRequest, messagingChatMessageWorkflowServiceApi.AdvanceChatMessageWorkflowResponse>(
    (request) => this.workflow.advanceChatMessageWorkflow(request),
  );

  /**
   * Cancels a chat message.
   */
  cancelChatMessageWorkflow = unary<messagingChatMessageWorkflowServiceApi.CancelChatMessageWorkflowRequest, messagingChatMessageWorkflowServiceApi.CancelChatMessageWorkflowResponse>(
    (request) => this.workflow.cancelChatMessageWorkflow(request),
  );

  /**
   * Lists chat messages a page at a time.
   */
  listChatMessageWorkflows = (call: ServerUnaryCall<messagingChatMessageWorkflowServiceApi.ListChatMessageWorkflowsRequest, messagingChatMessageWorkflowServiceApi.ListChatMessageWorkflowsResponse>, done: sendUnaryData<messagingChatMessageWorkflowServiceApi.ListChatMessageWorkflowsResponse>): void => {
    void this.workflow.listChatMessageWorkflows(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a chat message.
   */
  pauseChatMessageWorkflow = unary<messagingChatMessageWorkflowServiceApi.PauseChatMessageWorkflowRequest, messagingChatMessageWorkflowServiceApi.PauseChatMessageWorkflowResponse>(
    (request) => this.workflow.pauseChatMessageWorkflow(request),
  );

  /**
   * Retrys a chat message.
   */
  retryChatMessageWorkflow = unary<messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowRequest, messagingChatMessageWorkflowServiceApi.RetryChatMessageWorkflowResponse>(
    (request) => this.workflow.retryChatMessageWorkflow(request),
  );

  /**
   * Signals a chat message.
   */
  signalChatMessageWorkflow = (call: ServerUnaryCall<messagingChatMessageWorkflowServiceApi.SignalChatMessageWorkflowRequest, messagingChatMessageWorkflowServiceApi.SignalChatMessageWorkflowResponse>, done: sendUnaryData<messagingChatMessageWorkflowServiceApi.SignalChatMessageWorkflowResponse>): void => {
    void this.workflow.signalChatMessageWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts a chat message.
   */
  startChatMessageWorkflow = unary<messagingChatMessageWorkflowServiceApi.StartChatMessageWorkflowRequest, messagingChatMessageWorkflowServiceApi.StartChatMessageWorkflowResponse>(
    (request) => this.workflow.startChatMessageWorkflow(request),
  );
}

export function implementation(handler: ChatMessageWorkflowHandler): messagingChatMessageWorkflowServiceApi.ChatMessageWorkflowServiceServer {
  return {
    advanceChatMessageWorkflow: handler.advanceChatMessageWorkflow,
    cancelChatMessageWorkflow: handler.cancelChatMessageWorkflow,
    listChatMessageWorkflows: handler.listChatMessageWorkflows,
    pauseChatMessageWorkflow: handler.pauseChatMessageWorkflow,
    retryChatMessageWorkflow: handler.retryChatMessageWorkflow,
    signalChatMessageWorkflow: handler.signalChatMessageWorkflow,
    startChatMessageWorkflow: handler.startChatMessageWorkflow,
  };
}
