/**
 * Checks conversations against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as admissionsAdmissionCalculationServiceApi from "../../../../../.cache/proto/acme/admissions/v1/admission_calculation_service.js";
import * as auditAuditEventValidationServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as featurestoreFeatureViewCalculationServiceApi from "../../../../../.cache/proto/acme/featurestore/v1/feature_view_calculation_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationValidationServiceApi from "../../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
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
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toConversationRecord } from "../../data/records.js";
import { MessagingRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate conversation operations and persist audit data.
 */
@injectable()
export class ConversationValidationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionCalculationService") private readonly admissionsAdmissionCalculationClient: admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewCalculationService") private readonly featurestoreFeatureViewCalculationClient: featurestoreFeatureViewCalculationServiceApi.FeatureViewCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageCalculationService") private readonly messagingChatMessageCalculationClient: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationCalculationService") private readonly messagingConversationCalculationClient: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointQueryService") private readonly webhooksWebhookEndpointQueryClient: webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a conversation.
   */
  async checkConversationEligibility(req: messagingConversationValidationServiceApi.CheckConversationEligibilityRequest): Promise<messagingConversationValidationServiceApi.CheckConversationEligibilityResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "CheckConversationEligibility", req);
    this.logger.info("check_conversation_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{
          contact: {
            name: req?.conversation?.requester?.name,
            phone: (req?.details?.contact?.phone ?? ""),
          },
        }],
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.explainExperimentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest.fromPartial({
      chatMessage: {
        subject: { displayName: (reply1?.experiment?.organizer?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.conversation?.assignee?.email ?? "") } },
    });
    const reply2 = await this.workQueue.enqueue<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse>(
      "acme.messaging.v1.ConversationValidationService/CheckConversationEligibility:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationValidationServiceApi.CheckConversationEligibilityResponse.fromPartial({ outcome: { effectiveAt: reply1?.outcome?.effectiveAt } }),
      messagingConversationValidationServiceApi.CheckConversationEligibilityResponse.fromPartial({
        outcome: { status: (reply2?.outcome?.status ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      messagingConversationValidationServiceApi.CheckConversationEligibilityResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          customFields: (req?.conversation?.customFields ?? {}),
        },
      }),
    );
  }

  /**
   * Explains a conversation.
   */
  async explainConversationDecision(req: messagingConversationValidationServiceApi.ExplainConversationDecisionRequest): Promise<messagingConversationValidationServiceApi.ExplainConversationDecisionResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "ExplainConversationDecision", req);
    this.logger.info("explain_conversation_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsResponse>> = [];
    for (const item of (req?.conversation?.comments ?? [])) {
      tasks1.push(async () => {
        const request1 = featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsRequest.fromPartial({
          context: req?.context,
          featureView: {
            audit: { createdAt: item?.createdAt },
            owner: { email: (item?.authorEmail ?? "") },
          },
        });
        const invoke1: Unary<featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsRequest, featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsResponse> =
          (input, done) => this.featurestoreFeatureViewCalculationClient.compareFeatureViewOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsRequest, featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsResponse.fromPartial({});
    const request2 = messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest.fromPartial({
      chatMessage: {
        subject: { displayName: (reply1?.featureView?.owner?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          name: req?.details?.contact?.name,
        },
      },
    });
    const invoke2: Unary<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.explainChatMessageCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationValidationServiceApi.ExplainConversationDecisionResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      messagingConversationValidationServiceApi.ExplainConversationDecisionResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          priority: (req?.conversation?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Returns a conversation.
   */
  async getConversationRules(req: messagingConversationValidationServiceApi.GetConversationRulesRequest): Promise<messagingConversationValidationServiceApi.GetConversationRulesResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetConversationRules", req);
    this.logger.info("get_conversation_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointQueryServiceApi.ExportWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.conversationId ?? ""),
      },
    });
    const stream1 = this.webhooksWebhookEndpointQueryClient.exportWebhookEndpoints(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? webhooksWebhookEndpointQueryServiceApi.ExportWebhookEndpointsResponse.fromPartial({});
    return messagingConversationValidationServiceApi.GetConversationRulesResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } });
  }

  /**
   * Lints a conversation.
   */
  async lintConversations(req: messagingConversationValidationServiceApi.LintConversationsRequest): Promise<messagingConversationValidationServiceApi.LintConversationsResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "LintConversations", req);
    this.logger.info("lint_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: {
          displayName: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.displayName ?? ""),
        },
        origin: { $case: "channel", channel: {
          channel: ((req?.conversation?.origin?.$case === "channel" ? req?.conversation?.origin.channel : undefined)?.channel ?? ""),
        } },
        requester: { email: (req?.conversation?.requester?.email ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse> =
      (input, done) => this.notificationsNotificationValidationClient.checkNotificationEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest.fromPartial({
      admission: {
        subject: { displayName: (req?.conversation?.assignee?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { phone: (req?.conversation?.requester?.phone ?? "") } },
    });
    const invoke2: Unary<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse> =
      (input, done) => this.admissionsAdmissionCalculationClient.explainAdmissionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = messagingConversationCalculationServiceApi.EstimateConversationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { email: (reply1?.notification?.requester?.email ?? "") },
        sla: { breached: (req?.conversation?.sla?.breached ?? false) },
      },
    });
    const invoke3: Unary<messagingConversationCalculationServiceApi.EstimateConversationRequest, messagingConversationCalculationServiceApi.EstimateConversationResponse> =
      (input, done) => this.messagingConversationCalculationClient.estimateConversation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.conversation?.sla?.dueAt,
        ownerId: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.channelId ?? ""),
      },
    });
    const method4 = "suggestWebhookEndpoints" as const;
    const invoke4: Unary<webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationValidationServiceApi.LintConversationsResponse.fromPartial({
        conversation: { sla: { breached: (reply1?.notification?.sla?.breached ?? false) } },
      }),
      messagingConversationValidationServiceApi.LintConversationsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      messagingConversationValidationServiceApi.LintConversationsResponse.fromPartial({
        conversation: { requester: { name: reply3?.conversation?.requester?.name } },
      }),
      messagingConversationValidationServiceApi.LintConversationsResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      messagingConversationValidationServiceApi.LintConversationsResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          priority: (req?.conversation?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Normalizes a conversation.
   */
  async normalizeConversation(req: messagingConversationValidationServiceApi.NormalizeConversationRequest): Promise<messagingConversationValidationServiceApi.NormalizeConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "NormalizeConversation", req);
    this.logger.info("normalize_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest.fromPartial({
      chatMessage: {
        subject: {
          code: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.code ?? ""),
        },
      },
      context: req?.context,
    });
    const proxy1 = forwarding(this.messagingChatMessageCalculationClient);
    const invoke1: Unary<messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest, messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse> =
      (input, done) => proxy1.calculateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest, messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse>(invoke1, request1);
    let selected2_2: string | undefined;
    switch (req?.conversation?.origin?.$case) {
      case "customer":
        selected2_2 = ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest.fromPartial({
      chatMessage: { subject: { displayName: (selected2_2 ?? "") } },
      context: req?.context,
      details: { contact: { phone: (req?.conversation?.requester?.phone ?? "") } },
    });
    const invoke2: Unary<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.explainChatMessageCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationValidationServiceApi.NormalizeConversationResponse.fromPartial({
        conversation: {
          assignee: { displayName: (reply1?.chatMessage?.subject?.displayName ?? "") },
        },
      }),
      messagingConversationValidationServiceApi.NormalizeConversationResponse.fromPartial({ outcome: { effectiveAt: reply2?.outcome?.effectiveAt } }),
      messagingConversationValidationServiceApi.NormalizeConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          subject: (req?.conversation?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a conversation.
   */
  async previewConversation(req: messagingConversationValidationServiceApi.PreviewConversationRequest): Promise<messagingConversationValidationServiceApi.PreviewConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "PreviewConversation", req);
    this.logger.info("preview_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventValidationServiceApi.PreviewAuditEventRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.conversation?.requester?.name } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<auditAuditEventValidationServiceApi.PreviewAuditEventRequest, auditAuditEventValidationServiceApi.PreviewAuditEventResponse> =
      (input, done) => this.auditAuditEventValidationClient.previewAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventValidationServiceApi.PreviewAuditEventRequest, auditAuditEventValidationServiceApi.PreviewAuditEventResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest.fromPartial({
      chatMessage: {
        subject: {
          code: ((input2?.conversation?.origin?.$case === "customer" ? input2?.conversation?.origin.customer : undefined)?.code ?? ""),
          displayName: (reply1?.auditEvent?.subject?.displayName ?? ""),
        },
      },
      context: input2?.context,
    });
    const invoke2: Unary<messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest, messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.estimateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest, messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationValidationServiceApi.PreviewConversationResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      messagingConversationValidationServiceApi.PreviewConversationResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      messagingConversationValidationServiceApi.PreviewConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          subject: (req?.conversation?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a conversation.
   */
  async scoreConversation(req: messagingConversationValidationServiceApi.ScoreConversationRequest): Promise<messagingConversationValidationServiceApi.ScoreConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "ScoreConversation", req);
    this.logger.info("score_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
    });
    const cloned1: messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest, messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.estimateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<messagingChatMessageCalculationServiceApi.EstimateChatMessageRequest, messagingChatMessageCalculationServiceApi.EstimateChatMessageResponse>(invoke1, cloned1);
    const request2 = messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest.fromPartial({
      chatMessage: { subject: { code: (reply1?.chatMessage?.subject?.code ?? "") } },
      context: req?.context,
      details: {
        destination: { postalCode: (req?.details?.destination?.postalCode ?? "") },
      },
    });
    const decoded2 = messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest.toJSON(request2))),
    );
    const invoke2: Unary<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest, messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.compareChatMessageOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest, messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationValidationServiceApi.ScoreConversationResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      messagingConversationValidationServiceApi.ScoreConversationResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      messagingConversationValidationServiceApi.ScoreConversationResponse.fromPartial({
        conversation: {
          assignee: req?.conversation?.assignee,
          conversationId: (req?.conversationId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a conversation.
   */
  async validateConversation(req: messagingConversationValidationServiceApi.ValidateConversationRequest): Promise<messagingConversationValidationServiceApi.ValidateConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "ValidateConversation", req);
    this.logger.info("validate_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.conversation?.comments ?? []).map(async (item) => {
      const request1 = notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.createdAt,
          labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
          ownerId: (item?.commentId ?? ""),
        },
      });
      const invoke1: Unary<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse> =
        (input, done) => this.notificationsSubscriptionSyncClient.listSubscriptionConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse.fromPartial({});
    const request2 = messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest.fromPartial({
      chatMessage: {
        subject: {
          code: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.code ?? ""),
          displayName: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.CompareChatMessageOptionsRequest",
      value: Buffer.from(messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest.encode(request2).finish()),
    });
    const unpacked2 = messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest.decode(envelope2.value);
    const invoke2: Unary<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest, messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.compareChatMessageOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest, messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse>(invoke2, unpacked2);
    let selected3_1: string | undefined;
    switch (req?.conversation?.origin?.$case) {
      case "customer":
        selected3_1 = ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.channelId ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest.fromPartial({
      chatMessage: { subject: { channelId: (selected3_1 ?? "") } },
      context: req?.context,
    });
    const invoke3: Unary<messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest, messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse> =
      (input, done) => this.messagingChatMessageCalculationClient.calculateChatMessage(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<messagingChatMessageCalculationServiceApi.CalculateChatMessageRequest, messagingChatMessageCalculationServiceApi.CalculateChatMessageResponse>(invoke3, request3);
    const request4 = messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest.fromPartial({
      context: req?.context,
      conversation: {
        assignee: { userId: (req?.conversation?.assignee?.userId ?? "") },
        requester: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
      details: { contact: { email: (req?.conversation?.requester?.email ?? "") } },
    });
    const invoke4: Unary<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> =
      (input, done) => this.messagingConversationCalculationClient.explainConversationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest, messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationValidationServiceApi.ValidateConversationResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      messagingConversationValidationServiceApi.ValidateConversationResponse.fromPartial({ outcome: { status: (reply3?.result?.status ?? "") } }),
      messagingConversationValidationServiceApi.ValidateConversationResponse.fromPartial({
        conversation: {
          audit: { createdBy: (reply4?.conversation?.audit?.createdBy ?? "") },
          requester: reply4?.conversation?.requester,
        },
      }),
      messagingConversationValidationServiceApi.ValidateConversationResponse.fromPartial({
        conversation: {
          assignee: req?.conversation?.assignee,
          conversationId: (req?.conversationId ?? ""),
        },
      }),
    );
  }
}
