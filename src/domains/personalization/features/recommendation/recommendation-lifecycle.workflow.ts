/**
 * Moves a recommendation between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as communityModerationApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as communityPostApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as experimentsExperimentServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as featurestoreFeatureViewQueryServiceApi from "../../../../../.cache/proto/acme/featurestore/v1/feature_view_query_service.js";
import * as identityUserServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
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
  workflow,
} from "../../../../platform/rpc.js";
import { collect, upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { PersonalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate recommendation operations and persist audit data.
 */
@injectable()
export class RecommendationLifecycleWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewQueryService") private readonly featurestoreFeatureViewQueryClient: featurestoreFeatureViewQueryServiceApi.FeatureViewQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionHistoryService") private readonly notificationsSubscriptionHistoryClient: notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a recommendation.
   */
  async activateRecommendation(req: personalizationRecommendationLifecycleServiceApi.ActivateRecommendationRequest): Promise<personalizationRecommendationLifecycleServiceApi.ActivateRecommendationResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateRecommendation", req);
    this.logger.info("activate_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionRequest, notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.explainNotificationTemplateDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ActivateRecommendation.ExplainNotificationTemplateDecision", () => call<notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionRequest, notificationsNotificationTemplateValidationServiceApi.ExplainNotificationTemplateDecisionResponse>(invoke1, request1));
    const request2 = personalizationAffinitySyncServiceApi.SyncAffinitiesRequest.fromPartial({
      affinity: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<personalizationAffinitySyncServiceApi.SyncAffinitiesRequest, personalizationAffinitySyncServiceApi.SyncAffinitiesResponse> =
      (input, done) => this.personalizationAffinitySyncClient.syncAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = experimentsExperimentServiceApi.BatchCreateExperimentsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: req?.details?.notifyContact,
      } },
    });
    const reply3 = await upload<experimentsExperimentServiceApi.BatchCreateExperimentsRequest, experimentsExperimentServiceApi.BatchCreateExperimentsResponse>(
      (done) => this.experimentsExperimentClient.batchCreateExperiments(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationLifecycleServiceApi.ActivateRecommendationResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationRecommendationLifecycleServiceApi.ActivateRecommendationResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      personalizationRecommendationLifecycleServiceApi.ActivateRecommendationResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        recommendation: { recommendationId: (req?.recommendationId ?? "") },
      }),
    );
  }

  /**
   * Expires a recommendation.
   */
  async expireRecommendation(req: personalizationRecommendationLifecycleServiceApi.ExpireRecommendationRequest): Promise<personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireRecommendation", req);
    this.logger.info("expire_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityImportServiceApi.ListAffinityImportsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const reply1 = await this.workQueue.enqueue<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>(
      "acme.personalization.v1.RecommendationLifecycleService/ExpireRecommendation:0", request1,
    );
    const request2 = personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest.fromPartial({
      affinity: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.newOwner?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest, personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse> =
      (input, done) => this.personalizationAffinityImportClient.mapAffinityImportColumns(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<personalizationAffinityImportServiceApi.MapAffinityImportColumnsRequest, personalizationAffinityImportServiceApi.MapAffinityImportColumnsResponse>(invoke2, request2));
    const request3 = communityModerationApprovalServiceApi.DelegateModerationApprovalRequest.fromPartial({
      context: req?.context,
      moderation: {
        origin: { $case: "customer", customer: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      },
    });
    const invoke3: Unary<communityModerationApprovalServiceApi.DelegateModerationApprovalRequest, communityModerationApprovalServiceApi.DelegateModerationApprovalResponse> =
      (input, done) => this.communityModerationApprovalClient.delegateModerationApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<communityModerationApprovalServiceApi.DelegateModerationApprovalResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse.fromPartial({
        recommendation: {
          counterparty: {
            displayName: (reply3?.moderation?.assignee?.displayName ?? ""),
            email: (reply3?.moderation?.assignee?.email ?? ""),
          },
        },
      }),
      personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        recommendation: { recommendationId: (req?.recommendationId ?? "") },
      }),
    );
  }

  /**
   * Returns a recommendation.
   */
  async getRecommendationLifecycle(req: personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleRequest): Promise<personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRecommendationLifecycle", req);
    this.logger.info("get_recommendation_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.CalculateNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        origin: { $case: "externalReference", externalReference: (req?.recommendationId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
        sla: { dueAt: req?.context?.deadline },
      },
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.CalculateNotificationRequest, notificationsNotificationCalculationServiceApi.CalculateNotificationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.calculateNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleResponse.fromPartial({
        recommendation: { audit: { updatedBy: (reply1?.notification?.audit?.updatedBy ?? "") } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      personalizationRecommendationLifecycleServiceApi.GetRecommendationLifecycleResponse.fromPartial({ recommendation: { recommendationId: (req?.recommendationId ?? "") } }),
    );
  }

  /**
   * Reinstates a recommendation.
   */
  async reinstateRecommendation(req: personalizationRecommendationLifecycleServiceApi.ReinstateRecommendationRequest): Promise<personalizationRecommendationLifecycleServiceApi.ReinstateRecommendationResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateRecommendation", req);
    this.logger.info("reinstate_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityImportServiceApi.RetryAffinityImportRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse> =
      (input, done) => this.personalizationAffinityImportClient.retryAffinityImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = personalizationRecommendationSyncServiceApi.ReconcileRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        counterparty: { email: (req?.details?.newOwner?.email ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((reply1?.affinity?.attributes ?? {}))),
        }],
      },
    });
    const method2 = "reconcileRecommendations" as const;
    const invoke2: Unary<personalizationRecommendationSyncServiceApi.ReconcileRecommendationsRequest, personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationSyncClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationSyncServiceApi.ReconcileRecommendationsRequest, personalizationRecommendationSyncServiceApi.ReconcileRecommendationsResponse>(invoke2, request2);
    const request3 = personalizationProfileQueryServiceApi.ExportProfilesRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply2?.recommendation?.billingAddress?.region ?? "") },
    });
    const stream3 = this.personalizationProfileQueryClient.exportProfiles(request3, metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const messages3 = await collect(stream3);
    const reply3 = messages3.at(-1) ?? personalizationProfileQueryServiceApi.ExportProfilesResponse.fromPartial({});
    const request4 = communityPostApprovalServiceApi.RecallPostRequest.fromPartial({
      context: req?.context,
      post: {
        counterparty: { displayName: (reply1?.affinity?.subject?.displayName ?? "") },
      },
    });
    const proxy4 = forwarding(this.communityPostApprovalClient);
    const invoke4: Unary<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse> =
      (input, done) => proxy4.recallPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationLifecycleServiceApi.ReinstateRecommendationResponse.fromPartial({ result: { correlationId: (reply1?.affinity?.correlationId ?? "") } }),
      personalizationRecommendationLifecycleServiceApi.ReinstateRecommendationResponse.fromPartial({
        recommendation: {
          counterparty: {
            displayName: (reply2?.recommendation?.counterparty?.displayName ?? ""),
          },
        },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      personalizationRecommendationLifecycleServiceApi.ReinstateRecommendationResponse.fromPartial({
        recommendation: { audit: { updatedAt: reply4?.post?.audit?.updatedAt } },
        result: { status: (reply4?.outcome?.status ?? "") },
      }),
      personalizationRecommendationLifecycleServiceApi.ReinstateRecommendationResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        recommendation: { recommendationId: (req?.recommendationId ?? "") },
      }),
    );
  }

  /**
   * Renews a recommendation.
   */
  async renewRecommendation(req: personalizationRecommendationLifecycleServiceApi.RenewRecommendationRequest): Promise<personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewRecommendation", req);
    this.logger.info("renew_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileReportingServiceApi.ShareProfileReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse> =
      (input, done) => this.personalizationProfileReportingClient.shareProfileReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse>(invoke1, request1);
    const request2 = featurestoreFeatureViewQueryServiceApi.ResolveFeatureViewsRequest.fromPartial({ context: req?.context });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<featurestoreFeatureViewQueryServiceApi.ResolveFeatureViewsRequest, featurestoreFeatureViewQueryServiceApi.ResolveFeatureViewsResponse> =
      (input, done) => this.featurestoreFeatureViewQueryClient.resolveFeatureViews(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<featurestoreFeatureViewQueryServiceApi.ResolveFeatureViewsRequest, featurestoreFeatureViewQueryServiceApi.ResolveFeatureViewsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse.fromPartial({
        recommendation: { counterparty: { email: (reply1?.profile?.contact?.email ?? "") } },
      }),
      personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      personalizationRecommendationLifecycleServiceApi.RenewRecommendationResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        recommendation: { recommendationId: (req?.recommendationId ?? "") },
      }),
    );
  }

  /**
   * Suspends a recommendation.
   */
  async suspendRecommendation(req: personalizationRecommendationLifecycleServiceApi.SuspendRecommendationRequest): Promise<personalizationRecommendationLifecycleServiceApi.SuspendRecommendationResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendRecommendation", req);
    this.logger.info("suspend_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((input1?.annotations ?? {}))),
      context: input1?.context,
      notificationTemplate: {
        counterparty: { displayName: (input1?.details?.newOwner?.displayName ?? "") },
      },
      reason: (input1?.reason ?? ""),
    });
    const invoke1: Unary<notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateRequest, notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.pushNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateRequest, notificationsNotificationTemplateSyncServiceApi.PushNotificationTemplateResponse>(invoke1, request1);
    const request2 = identityUserServiceApi.CreateUserRequest.fromPartial({
      context: req?.context,
      user: {
        audit: { updatedAt: reply1?.notificationTemplate?.audit?.updatedAt },
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
        },
        primaryAddress: {
          recipient: (reply1?.notificationTemplate?.billingAddress?.recipient ?? ""),
        },
      },
    });
    const cloned2: identityUserServiceApi.CreateUserRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<identityUserServiceApi.CreateUserRequest, identityUserServiceApi.CreateUserResponse> =
      (input, done) => this.identityUserClient.createUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserServiceApi.CreateUserRequest, identityUserServiceApi.CreateUserResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      personalizationRecommendationLifecycleServiceApi.SuspendRecommendationResponse.fromPartial({
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
        recommendation: { dueAt: reply1?.notificationTemplate?.dueAt },
      }),
      personalizationRecommendationLifecycleServiceApi.SuspendRecommendationResponse.fromPartial({
        recommendation: { lines: [{ attributes: (reply2?.user?.attributes ?? {}) }] },
      }),
      personalizationRecommendationLifecycleServiceApi.SuspendRecommendationResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        recommendation: { recommendationId: (req?.recommendationId ?? "") },
      }),
    );
  }

  /**
   * Terminates a recommendation.
   */
  async terminateRecommendation(req: personalizationRecommendationLifecycleServiceApi.TerminateRecommendationRequest): Promise<personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse> {
    validateContext(req.context);
    if (!req.recommendationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "recommendation_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateRecommendation", req);
    this.logger.info("terminate_recommendation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.ListUsersRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const decoded1 = identityUserServiceApi.ListUsersRequest.fromJSON(
      JSON.parse(JSON.stringify(identityUserServiceApi.ListUsersRequest.toJSON(request1))),
    );
    const invoke1: Unary<identityUserServiceApi.ListUsersRequest, identityUserServiceApi.ListUsersResponse> =
      (input, done) => this.identityUserClient.listUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserServiceApi.ListUsersRequest, identityUserServiceApi.ListUsersResponse>(invoke1, decoded1);
    const request2 = notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest.fromPartial({
      context: req?.context,
      subscription: {
        action: { $case: "block", block: { notifyEmail: (req?.details?.notifyContact?.email ?? "") } },
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.notifications.v1.RecordSubscriptionVersionRequest",
      value: Buffer.from(notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest.encode(request2).finish()),
    });
    const unpacked2 = notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest.decode(envelope2.value);
    const invoke2: Unary<notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionResponse> =
      (input, done) => this.notificationsSubscriptionHistoryClient.recordSubscriptionVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionRequest, notificationsSubscriptionHistoryServiceApi.RecordSubscriptionVersionResponse>(invoke2, unpacked2);
    const request3 = personalizationAffinityValidationServiceApi.LintAffinitiesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const client3 = this.clients.get<personalizationAffinityValidationServiceApi.AffinityValidationServiceClient>("acme.personalization.v1.AffinityValidationService");
    const invoke3: Unary<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse> =
      (input, done) => client3.lintAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse>(invoke3, request3);
    const request4 = personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((reply2?.subscription?.action?.$case === "block" ? reply2?.subscription?.action.block : undefined)?.reason ?? ""),
    });
    const invoke4: Unary<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.scheduleRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        recommendation: { audit: { createdAt: reply2?.subscription?.audit?.createdAt } },
      }),
      personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          details: (reply4?.result?.details ?? {}),
        },
      }),
      personalizationRecommendationLifecycleServiceApi.TerminateRecommendationResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        recommendation: { recommendationId: (req?.recommendationId ?? "") },
      }),
    );
  }
}
