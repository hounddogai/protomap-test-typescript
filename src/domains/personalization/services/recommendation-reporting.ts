/**
 * Builds and schedules reports about recommendations. Remote work stays behind typed client ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as localizationTranslationKeyServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as messagingConversationValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as telematicsTelemetryReadingCalculationServiceApi from "../../../../.cache/proto/acme/telematics/v1/telemetry_reading_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate recommendation operations and persist audit data.
 */
@injectable()
export class RecommendationReportingWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyService") private readonly localizationTranslationKeyClient: localizationTranslationKeyServiceApi.TranslationKeyServiceClient,
    @inject("grpc:acme.messaging.v1.ConversationValidationService") private readonly messagingConversationValidationClient: messagingConversationValidationServiceApi.ConversationValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationValidationService") private readonly notificationsNotificationValidationClient: notificationsNotificationValidationServiceApi.NotificationValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingCalculationService") private readonly telematicsTelemetryReadingCalculationClient: telematicsTelemetryReadingCalculationServiceApi.TelemetryReadingCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts recommendations by status.
   */
  async countRecommendationTotals(req: personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest): Promise<personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountRecommendationTotals", req);
    this.logger.info("count_recommendation_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumWorkflowServiceApi.RetryForumWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.context?.actor?.email ?? "") } },
      forum: {
        children: [{
          location: { region: (req?.filter?.region ?? "") },
          manager: { userId: (req?.context?.actor?.userId ?? "") },
        }],
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<communityForumWorkflowServiceApi.RetryForumWorkflowRequest, communityForumWorkflowServiceApi.RetryForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.retryForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumWorkflowServiceApi.RetryForumWorkflowRequest, communityForumWorkflowServiceApi.RetryForumWorkflowResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse.fromPartial({
      result: {
        message: (reply1?.result?.message ?? ""),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Deletes a recommendation.
   */
  async deleteRecommendationReport(req: personalizationRecommendationReportingServiceApi.DeleteRecommendationReportRequest): Promise<personalizationRecommendationReportingServiceApi.DeleteRecommendationReportResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteRecommendationReport", req);
    this.logger.info("delete_recommendation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = identityUserServiceApi.UpdateUserRequest.fromPartial({
      context: input1?.context,
      user: { audit: { etag: (input1?.etag ?? "") } },
    });
    const invoke1: Unary<identityUserServiceApi.UpdateUserRequest, identityUserServiceApi.UpdateUserResponse> =
      (input, done) => this.identityUserClient.updateUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserServiceApi.UpdateUserRequest, identityUserServiceApi.UpdateUserResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return personalizationRecommendationReportingServiceApi.DeleteRecommendationReportResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        details: (reply1?.result?.details ?? {}),
      },
    });
  }

  /**
   * Returns a recommendation.
   */
  async fetchRecommendationReport(req: personalizationRecommendationReportingServiceApi.FetchRecommendationReportRequest): Promise<personalizationRecommendationReportingServiceApi.FetchRecommendationReportResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchRecommendationReport", req);
    this.logger.info("fetch_recommendation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    return personalizationRecommendationReportingServiceApi.FetchRecommendationReportResponse.fromPartial({ recommendation: { recommendationId: (req?.recommendationId ?? "") } });
  }

  /**
   * Generates a recommendation.
   */
  async generateRecommendationReport(req: personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest): Promise<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateRecommendationReport", req);
    this.logger.info("generate_recommendation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
      recommendationId: (req?.recommendationId ?? ""),
    });
    const cloned1: personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest, personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.resolveRecommendationConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest, personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists recommendations a page at a time.
   */
  async listRecommendationReports(req: personalizationRecommendationReportingServiceApi.ListRecommendationReportsRequest): Promise<personalizationRecommendationReportingServiceApi.ListRecommendationReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListRecommendationReports", req);
    this.logger.info("list_recommendation_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.filter?.ownerId ?? "") },
    });
    const stream1 = this.notificationsNotificationTemplateExportClient.streamNotificationTemplateExport(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationRecommendationReportingServiceApi.ListRecommendationReportsResponse.fromPartial({});
  }

  /**
   * Schedules a recommendation.
   */
  async scheduleRecommendationReport(req: personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest): Promise<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleRecommendationReport", req);
    this.logger.info("schedule_recommendation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationServiceApi.CloneNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const decoded1 = notificationsNotificationServiceApi.CloneNotificationRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsNotificationServiceApi.CloneNotificationRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsNotificationServiceApi.CloneNotificationRequest, notificationsNotificationServiceApi.CloneNotificationResponse> =
      (input, done) => this.notificationsNotificationClient.cloneNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationServiceApi.CloneNotificationRequest, notificationsNotificationServiceApi.CloneNotificationResponse>(invoke1, decoded1);
    const request2 = messagingConversationValidationServiceApi.ExplainConversationDecisionRequest.fromPartial({
      context: req?.context,
      conversation: {
        audit: { createdBy: (reply1?.notification?.audit?.createdBy ?? "") },
        origin: { $case: "customer", customer: { displayName: (reply1?.notification?.assignee?.displayName ?? "") } },
        sla: { policyId: (reply1?.notification?.sla?.policyId ?? "") },
      },
      details: { contact: { email: (reply1?.notification?.requester?.email ?? "") } },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.messaging.v1.ExplainConversationDecisionRequest",
      value: Buffer.from(messagingConversationValidationServiceApi.ExplainConversationDecisionRequest.encode(request2).finish()),
    });
    const unpacked2 = messagingConversationValidationServiceApi.ExplainConversationDecisionRequest.decode(envelope2.value);
    const invoke2: Unary<messagingConversationValidationServiceApi.ExplainConversationDecisionRequest, messagingConversationValidationServiceApi.ExplainConversationDecisionResponse> =
      (input, done) => this.messagingConversationValidationClient.explainConversationDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<messagingConversationValidationServiceApi.ExplainConversationDecisionRequest, messagingConversationValidationServiceApi.ExplainConversationDecisionResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse.fromPartial({ result: { message: (reply2?.outcome?.message ?? "") } }),
      personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares a recommendation.
   */
  async shareRecommendationReport(req: personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest): Promise<personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareRecommendationReport", req);
    this.logger.info("share_recommendation_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeApprovalServiceApi.RejectBadgeRequest.fromPartial({
      badge: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: { email: (req?.details?.recipient?.email ?? "") },
      },
      context: req?.context,
    });
    const client1 = this.clients.get<communityBadgeApprovalServiceApi.BadgeApprovalServiceClient>("acme.community.v1.BadgeApprovalService");
    const invoke1: Unary<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse> =
      (input, done) => client1.rejectBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse>(invoke1, request1);
    const request2 = communityForumWorkflowServiceApi.PauseForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ manager: { email: (reply1?.badge?.owner?.email ?? "") } }],
        }],
      },
    });
    const invoke2: Unary<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.pauseForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { recipient: (reply2?.forum?.location?.recipient ?? "") },
      },
    });
    const invoke3: Unary<telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsRequest, telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsResponse> =
      (input, done) => this.telematicsTelemetryReadingCalculationClient.compareTelemetryReadingOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsRequest, telematicsTelemetryReadingCalculationServiceApi.CompareTelemetryReadingOptionsResponse>(invoke3, request3));
    const request4 = localizationTranslationKeyServiceApi.WatchTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply2?.forum?.location?.region ?? "") },
      subscriber: {
        email: (reply1?.badge?.owner?.email ?? ""),
        name: req?.details?.recipient?.name,
        phone: (req?.details?.recipient?.phone ?? ""),
      },
    });
    const stream4 = this.localizationTranslationKeyClient.watchTranslationKeys(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? localizationTranslationKeyServiceApi.WatchTranslationKeysResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.details?.channel ?? "") });
    return mergeResponses(
      personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse.fromPartial({ outcome: { status: (reply1?.outcome?.status ?? "") } }),
      personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse.fromPartial({
        recommendation: { lines: [{ attributes: (reply3?.telemetryReading?.attributes ?? {}) }] },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse.fromPartial({
        recommendation: {
          counterparty: { email: (req?.details?.recipient?.email ?? "") },
          recommendationId: (req?.recommendationId ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of recommendations as they happen.
   */
  async streamRecommendationMetrics(req: personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsRequest): Promise<personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "StreamRecommendationMetrics", req);
    this.logger.info("stream_recommendation_metrics", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationSyncServiceApi.PullRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: { counterparty: { email: (req?.subscriber?.email ?? "") } },
    });
    const invoke1: Unary<personalizationRecommendationSyncServiceApi.PullRecommendationsRequest, personalizationRecommendationSyncServiceApi.PullRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.pullRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("StreamRecommendationMetrics.PullRecommendations", () => call<personalizationRecommendationSyncServiceApi.PullRecommendationsRequest, personalizationRecommendationSyncServiceApi.PullRecommendationsResponse>(invoke1, request1));
    const request2 = personalizationProfileQueryServiceApi.SuggestProfilesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.filter?.createdAfter },
    });
    const invoke2: Unary<personalizationProfileQueryServiceApi.SuggestProfilesRequest, personalizationProfileQueryServiceApi.SuggestProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.suggestProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (reply1?.recommendation?.counterparty?.email ?? "") },
      },
      notification: {
        audit: { updatedAt: reply1?.recommendation?.audit?.updatedAt },
        comments: [{ createdAt: reply1?.recommendation?.audit?.createdAt }],
      },
    });
    const reply3 = await this.workQueue.enqueue<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse>(
      "acme.personalization.v1.RecommendationReportingService/StreamRecommendationMetrics:2", request3,
    );
    let selected4_2: string | undefined;
    switch (reply1?.recommendation?.settlement?.$case) {
      case "card":
        selected4_2 = ((reply1?.recommendation?.settlement?.$case === "card" ? reply1?.recommendation?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected4_2 = "";
    }
    const request4 = personalizationRecommendationSyncServiceApi.PushRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: {
          createdBy: (reply1?.recommendation?.audit?.createdBy ?? ""),
          etag: (reply3?.notification?.audit?.etag ?? ""),
        },
        settlement: { $case: "card", card: { holderName: (selected4_2 ?? "") } },
      },
    });
    const invoke4: Unary<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.pushRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse.fromPartial({
        recommendation: {
          billingAddress: { recipient: (reply1?.recommendation?.billingAddress?.recipient ?? "") },
        },
      }),
      personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse.fromPartial({
        recommendation: {
          counterparty: {
            displayName: ((reply3?.notification?.origin?.$case === "customer" ? reply3?.notification?.origin.customer : undefined)?.displayName ?? ""),
            email: (reply3?.notification?.requester?.email ?? ""),
          },
        },
      }),
      personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse.fromPartial({
        recommendation: {
          audit: { etag: (reply4?.recommendation?.audit?.etag ?? "") },
          dueAt: reply4?.recommendation?.dueAt,
        },
      }),
      personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse.fromPartial({
        recommendation: { billingAddress: { region: (req?.filter?.region ?? "") } },
      }),
    );
  }
}

/**
 * The gRPC boundary for RecommendationReportingService; workflows own validation and database transactions.
 */
@injectable()
export class RecommendationReportingHandler {
  constructor(@inject(RecommendationReportingWorkflow) private readonly workflow: RecommendationReportingWorkflow) {}

  /**
   * Counts recommendations by status.
   */
  countRecommendationTotals = unary<personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest, personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse>(
    (request) => this.workflow.countRecommendationTotals(request),
  );

  /**
   * Deletes a recommendation.
   */
  deleteRecommendationReport = unary<personalizationRecommendationReportingServiceApi.DeleteRecommendationReportRequest, personalizationRecommendationReportingServiceApi.DeleteRecommendationReportResponse>(
    (request) => this.workflow.deleteRecommendationReport(request),
  );

  /**
   * Returns a recommendation.
   */
  fetchRecommendationReport = (call: ServerUnaryCall<personalizationRecommendationReportingServiceApi.FetchRecommendationReportRequest, personalizationRecommendationReportingServiceApi.FetchRecommendationReportResponse>, done: sendUnaryData<personalizationRecommendationReportingServiceApi.FetchRecommendationReportResponse>): void => {
    void this.workflow.fetchRecommendationReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Generates a recommendation.
   */
  generateRecommendationReport = unary<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse>(
    (request) => this.workflow.generateRecommendationReport(request),
  );

  /**
   * Lists recommendations a page at a time.
   */
  listRecommendationReports = unary<personalizationRecommendationReportingServiceApi.ListRecommendationReportsRequest, personalizationRecommendationReportingServiceApi.ListRecommendationReportsResponse>(
    (request) => this.workflow.listRecommendationReports(request),
  );

  /**
   * Schedules a recommendation.
   */
  scheduleRecommendationReport = (call: ServerUnaryCall<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse>, done: sendUnaryData<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse>): void => {
    void this.workflow.scheduleRecommendationReport(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Shares a recommendation.
   */
  shareRecommendationReport = unary<personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse>(
    (request) => this.workflow.shareRecommendationReport(request),
  );

  /**
   * Streams the changes of recommendations as they happen.
   */
  streamRecommendationMetrics = serverStream<personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsRequest, personalizationRecommendationReportingServiceApi.StreamRecommendationMetricsResponse>(
    (request) => this.workflow.streamRecommendationMetrics(request),
  );
}

export function implementation(handler: RecommendationReportingHandler): personalizationRecommendationReportingServiceApi.RecommendationReportingServiceServer {
  return {
    countRecommendationTotals: handler.countRecommendationTotals,
    deleteRecommendationReport: handler.deleteRecommendationReport,
    fetchRecommendationReport: handler.fetchRecommendationReport,
    generateRecommendationReport: handler.generateRecommendationReport,
    listRecommendationReports: handler.listRecommendationReports,
    scheduleRecommendationReport: handler.scheduleRecommendationReport,
    shareRecommendationReport: handler.shareRecommendationReport,
    streamRecommendationMetrics: handler.streamRecommendationMetrics,
  };
}
