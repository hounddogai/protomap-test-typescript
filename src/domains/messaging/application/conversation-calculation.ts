/**
 * Computes the figures of a conversation, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as admissionsAdmissionCalculationServiceApi from "../../../../.cache/proto/acme/admissions/v1/admission_calculation_service.js";
import * as audiencesAudienceMemberQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as contentArticleQueryServiceApi from "../../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as datasetsDatasetServiceApi from "../../../../.cache/proto/acme/datasets/v1/dataset_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as prescriptionsPrescriptionCalculationServiceApi from "../../../../.cache/proto/acme/prescriptions/v1/prescription_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toConversationRecord } from "../data/records.js";
import { MessagingRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate conversation operations and persist audit data.
 */
@injectable()
export class ConversationCalculationWorkflow {
  constructor(
    @inject(MessagingRepository) private readonly repository: MessagingRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.admissions.v1.AdmissionCalculationService") private readonly admissionsAdmissionCalculationClient: admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceMemberQueryService") private readonly audiencesAudienceMemberQueryClient: audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.content.v1.ArticleQueryService") private readonly contentArticleQueryClient: contentArticleQueryServiceApi.ArticleQueryServiceClient,
    @inject("grpc:acme.datasets.v1.DatasetService") private readonly datasetsDatasetClient: datasetsDatasetServiceApi.DatasetServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.prescriptions.v1.PrescriptionCalculationService") private readonly prescriptionsPrescriptionCalculationClient: prescriptionsPrescriptionCalculationServiceApi.PrescriptionCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a conversation.
   */
  async calculateConversation(req: messagingConversationCalculationServiceApi.CalculateConversationRequest): Promise<messagingConversationCalculationServiceApi.CalculateConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "CalculateConversation", req);
    this.logger.info("calculate_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = prescriptionsPrescriptionCalculationServiceApi.RecalculatePrescriptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
      prescription: {
        audit: { createdAt: req?.conversation?.audit?.createdAt },
        billingAddress: { recipient: (req?.details?.destination?.recipient ?? "") },
      },
    });
    const invoke1: Unary<prescriptionsPrescriptionCalculationServiceApi.RecalculatePrescriptionsRequest, prescriptionsPrescriptionCalculationServiceApi.RecalculatePrescriptionsResponse> =
      (input, done) => this.prescriptionsPrescriptionCalculationClient.recalculatePrescriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<prescriptionsPrescriptionCalculationServiceApi.RecalculatePrescriptionsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const settled2 = await Promise.allSettled((req?.conversation?.comments ?? []).map(async (item) => {
      const request2 = formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest.fromPartial({
        context: req?.context,
        details: {
          contact: {
            email: (item?.authorEmail ?? ""),
            preferredChannel: (req?.conversation?.requester?.preferredChannel ?? ""),
          },
        },
      });
      const invoke2: Unary<formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest, formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse> =
        (input, done) => this.formsFormSubmissionValidationClient.previewFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest, formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse.fromPartial({});
    const request3 = notificationsNotificationSyncServiceApi.ReconcileNotificationsRequest.fromPartial({
      context: req?.context,
      notification: {
        audit: { updatedBy: (reply1?.prescription?.audit?.updatedBy ?? "") },
        sla: { breached: (req?.conversation?.sla?.breached ?? false) },
      },
    });
    const invoke3: Unary<notificationsNotificationSyncServiceApi.ReconcileNotificationsRequest, notificationsNotificationSyncServiceApi.ReconcileNotificationsResponse> =
      (input, done) => this.notificationsNotificationSyncClient.reconcileNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    const results4 = await Promise.all((req?.conversation?.history ?? []).map(async (item) => {
      const request4 = audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.changedAt,
          region: (req?.details?.destination?.region ?? ""),
        },
      });
      const stream4 = this.audiencesAudienceMemberQueryClient.exportAudienceMembers(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
      const messages4 = await collect(stream4);
      const reply4 = messages4.at(-1) ?? audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({});
      return reply4;
    }));
    const reply4 = results4.at(-1) ?? audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationCalculationServiceApi.CalculateConversationResponse.fromPartial({
        conversation: {
          assignee: { email: (reply1?.prescription?.counterparty?.email ?? "") },
          sla: { dueAt: reply1?.prescription?.dueAt },
        },
      }),
      messagingConversationCalculationServiceApi.CalculateConversationResponse.fromPartial({
        conversation: { assignee: { email: (reply3?.notification?.requester?.email ?? "") } },
      }),
      messagingConversationCalculationServiceApi.CalculateConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          requester: req?.conversation?.requester,
        },
      }),
    );
  }

  /**
   * Compares a conversation.
   */
  async compareConversationOptions(req: messagingConversationCalculationServiceApi.CompareConversationOptionsRequest): Promise<messagingConversationCalculationServiceApi.CompareConversationOptionsResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "CompareConversationOptions", req);
    this.logger.info("compare_conversation_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleQueryServiceApi.SummarizeArticlesRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<contentArticleQueryServiceApi.SummarizeArticlesRequest, contentArticleQueryServiceApi.SummarizeArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.summarizeArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      messagingConversationCalculationServiceApi.CompareConversationOptionsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      messagingConversationCalculationServiceApi.CompareConversationOptionsResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          subject: (req?.conversation?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a conversation.
   */
  async estimateConversation(req: messagingConversationCalculationServiceApi.EstimateConversationRequest): Promise<messagingConversationCalculationServiceApi.EstimateConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "EstimateConversation", req);
    this.logger.info("estimate_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { createdAt: req?.conversation?.audit?.createdAt },
        owner: { userId: (req?.conversation?.assignee?.userId ?? "") },
      },
    });
    const method1 = "resolveSubscriptionConflict" as const;
    const invoke1: Unary<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest, notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest, notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse>> = [];
    for (const item of (req?.conversation?.history ?? [])) {
      tasks2.push(async () => {
        const request2 = notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowRequest.fromPartial({
          context: req?.context,
          deliveryAttempt: {
            measurements: [{ observedAt: item?.changedAt }],
            subject: {
              displayName: ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.displayName ?? ""),
            },
          },
          details: {
            notify: {
              email: (req?.conversation?.assignee?.email ?? ""),
              phone: (req?.conversation?.requester?.phone ?? ""),
            },
          },
        });
        const invoke2: Unary<notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse> =
          (input, done) => this.notificationsDeliveryAttemptWorkflowClient.cancelDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? notificationsDeliveryAttemptWorkflowServiceApi.CancelDeliveryAttemptWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationCalculationServiceApi.EstimateConversationResponse.fromPartial({
        conversation: { audit: { etag: (reply1?.subscription?.audit?.etag ?? "") } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      messagingConversationCalculationServiceApi.EstimateConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          status: req?.conversation?.status,
        },
      }),
    );
  }

  /**
   * Explains a conversation.
   */
  async explainConversationCalculation(req: messagingConversationCalculationServiceApi.ExplainConversationCalculationRequest): Promise<messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "ExplainConversationCalculation", req);
    this.logger.info("explain_conversation_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.conversation?.requester?.email ?? ""),
          name: req?.conversation?.requester?.name,
          phone: (req?.details?.contact?.phone ?? ""),
          preferredChannel: (req?.conversation?.requester?.preferredChannel ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.notificationsDeliveryAttemptWorkflowClient);
    const invoke1: Unary<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse> =
      (input, done) => proxy1.pauseDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>(invoke1, request1);
    let selected2_2: string | undefined;
    switch (req?.conversation?.origin?.$case) {
      case "customer":
        selected2_2 = ((req?.conversation?.origin?.$case === "customer" ? req?.conversation?.origin.customer : undefined)?.displayName ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest.fromPartial({
      admission: { subject: { displayName: (selected2_2 ?? "") } },
      context: req?.context,
      details: { contact: { phone: (req?.conversation?.requester?.phone ?? "") } },
    });
    const invoke2: Unary<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse> =
      (input, done) => this.admissionsAdmissionCalculationClient.explainAdmissionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse.fromPartial({
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      messagingConversationCalculationServiceApi.ExplainConversationCalculationResponse.fromPartial({
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
  async getConversationRates(req: messagingConversationCalculationServiceApi.GetConversationRatesRequest): Promise<messagingConversationCalculationServiceApi.GetConversationRatesResponse> {
    validateContext(req.context);
    if (!req.conversationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "conversation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetConversationRates", req);
    this.logger.info("get_conversation_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    return messagingConversationCalculationServiceApi.GetConversationRatesResponse.fromPartial({ conversation: { conversationId: (req?.conversationId ?? "") } });
  }

  /**
   * Quotes a conversation.
   */
  async quoteConversation(req: messagingConversationCalculationServiceApi.QuoteConversationRequest): Promise<messagingConversationCalculationServiceApi.QuoteConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "QuoteConversation", req);
    this.logger.info("quote_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationSyncServiceApi.PullNotificationsRequest.fromPartial({
      context: req?.context,
      notification: {
        audit: {
          createdAt: req?.conversation?.audit?.createdAt,
          updatedAt: req?.conversation?.audit?.updatedAt,
        },
        origin: { $case: "channel", channel: {
          channel: ((req?.conversation?.origin?.$case === "channel" ? req?.conversation?.origin.channel : undefined)?.channel ?? ""),
        } },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsNotificationSyncServiceApi.PullNotificationsRequest, notificationsNotificationSyncServiceApi.PullNotificationsResponse> =
      (input, done) => this.notificationsNotificationSyncClient.pullNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationSyncServiceApi.PullNotificationsRequest, notificationsNotificationSyncServiceApi.PullNotificationsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest.fromPartial({
      context: input2?.context,
      subscription: {
        audit: {
          createdAt: reply1?.notification?.audit?.createdAt,
          etag: (reply1?.notification?.audit?.etag ?? ""),
        },
        owner: {
          displayName: ((input2?.conversation?.origin?.$case === "customer" ? input2?.conversation?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest, notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.resolveSubscriptionConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest, notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse>(invoke2, request2);
    const results3 = await Promise.all((req?.conversation?.comments ?? []).map(async (item) => {
      const request3 = notificationsNotificationValidationServiceApi.PreviewNotificationRequest.fromPartial({
        context: req?.context,
        notification: {
          audit: { createdAt: item?.createdAt },
          comments: [{
            commentId: (item?.commentId ?? ""),
            visibility: (item?.visibility ?? ""),
          }],
        },
      });
      const invoke3: Unary<notificationsNotificationValidationServiceApi.PreviewNotificationRequest, notificationsNotificationValidationServiceApi.PreviewNotificationResponse> =
        (input, done) => this.notificationsNotificationValidationClient.previewNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<notificationsNotificationValidationServiceApi.PreviewNotificationRequest, notificationsNotificationValidationServiceApi.PreviewNotificationResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? notificationsNotificationValidationServiceApi.PreviewNotificationResponse.fromPartial({});
    const request4 = formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        subject: { displayName: (reply2?.subscription?.owner?.displayName ?? "") },
      },
    });
    const cloned4: formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest = JSON.parse(JSON.stringify(request4));
    const invoke4: Unary<formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest, formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionValidationClient.previewFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<formsFormSubmissionValidationServiceApi.PreviewFormSubmissionRequest, formsFormSubmissionValidationServiceApi.PreviewFormSubmissionResponse>(invoke4, cloned4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationCalculationServiceApi.QuoteConversationResponse.fromPartial({
        conversation: { assignee: { email: (reply1?.notification?.requester?.email ?? "") } },
      }),
      messagingConversationCalculationServiceApi.QuoteConversationResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      messagingConversationCalculationServiceApi.QuoteConversationResponse.fromPartial({
        result: { correlationId: (reply4?.formSubmission?.correlationId ?? "") },
      }),
      messagingConversationCalculationServiceApi.QuoteConversationResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          customFields: (req?.conversation?.customFields ?? {}),
        },
      }),
    );
  }

  /**
   * Recalculates a conversation.
   */
  async recalculateConversations(req: messagingConversationCalculationServiceApi.RecalculateConversationsRequest): Promise<messagingConversationCalculationServiceApi.RecalculateConversationsResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "RecalculateConversations", req);
    this.logger.info("recalculate_conversations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest.fromPartial({ context: req?.context });
    const decoded1 = audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest.fromJSON(
      JSON.parse(JSON.stringify(audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest.toJSON(request1))),
    );
    const invoke1: Unary<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse> =
      (input, done) => this.audiencesAudienceMemberQueryClient.resolveAudienceMembers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersRequest, audiencesAudienceMemberQueryServiceApi.ResolveAudienceMembersResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationCalculationServiceApi.RecalculateConversationsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      messagingConversationCalculationServiceApi.RecalculateConversationsResponse.fromPartial({
        conversation: {
          conversationId: (req?.conversationId ?? ""),
          requester: req?.conversation?.requester,
        },
      }),
    );
  }

  /**
   * Simulates a conversation.
   */
  async simulateConversation(req: messagingConversationCalculationServiceApi.SimulateConversationRequest): Promise<messagingConversationCalculationServiceApi.SimulateConversationResponse> {
    validateContext(req.context);
    if (req.conversation) {
      await this.repository.save(toConversationRecord(req.context.tenantId, req.conversation));
    }
    await this.repository.record(req.context.tenantId, "SimulateConversation", req);
    this.logger.info("simulate_conversation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.ExplainForumDecisionRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: {
              postalCode: (req?.details?.destination?.postalCode ?? ""),
              region: (req?.details?.destination?.region ?? ""),
            },
            manager: { userId: (req?.conversation?.assignee?.userId ?? "") },
          }],
        }],
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.ExplainForumDecisionRequest",
      value: Buffer.from(communityForumValidationServiceApi.ExplainForumDecisionRequest.encode(request1).finish()),
    });
    const unpacked1 = communityForumValidationServiceApi.ExplainForumDecisionRequest.decode(envelope1.value);
    const invoke1: Unary<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse> =
      (input, done) => this.communityForumValidationClient.explainForumDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse>(invoke1, unpacked1);
    const request2 = audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.forum?.audit?.updatedAt,
        ownerId: (reply1?.forum?.manager?.userId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream2 = this.audiencesAudienceMemberQueryClient.exportAudienceMembers(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? audiencesAudienceMemberQueryServiceApi.ExportAudienceMembersResponse.fromPartial({});
    const results3 = await Promise.all((req?.conversation?.comments ?? []).map(async (item) => {
      const request3 = datasetsDatasetServiceApi.WatchDatasetsRequest.fromPartial({
        context: req?.context,
        filter: { region: (reply1?.forum?.location?.region ?? "") },
        subscriber: {
          email: (item?.authorEmail ?? ""),
          phone: (req?.conversation?.requester?.phone ?? ""),
          preferredChannel: (req?.conversation?.requester?.preferredChannel ?? ""),
        },
      });
      const stream3 = this.datasetsDatasetClient.watchDatasets(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
      const messages3 = await collect(stream3);
      const reply3 = messages3.at(-1) ?? datasetsDatasetServiceApi.WatchDatasetsResponse.fromPartial({});
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? datasetsDatasetServiceApi.WatchDatasetsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      messagingConversationCalculationServiceApi.SimulateConversationResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      messagingConversationCalculationServiceApi.SimulateConversationResponse.fromPartial({
        conversation: {
          assignee: req?.conversation?.assignee,
          conversationId: (req?.conversationId ?? ""),
        },
      }),
    );
  }
}
