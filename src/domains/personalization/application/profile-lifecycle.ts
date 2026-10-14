/**
 * Moves a profile between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as catalogProductServiceApi from "../../../../.cache/proto/acme/catalog/v1/product_service.js";
import * as communityBadgeWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as communityModerationApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as concessionsConcessionStandCalculationServiceApi from "../../../../.cache/proto/acme/concessions/v1/concession_stand_calculation_service.js";
import * as featurestoreFeatureViewCalculationServiceApi from "../../../../.cache/proto/acme/featurestore/v1/feature_view_calculation_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toProfileRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate profile operations and persist audit data.
 */
@injectable()
export class ProfileLifecycleWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.catalog.v1.ProductService") private readonly catalogProductClient: catalogProductServiceApi.ProductServiceClient,
    @inject("grpc:acme.community.v1.BadgeWorkflowService") private readonly communityBadgeWorkflowClient: communityBadgeWorkflowServiceApi.BadgeWorkflowServiceClient,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandCalculationService") private readonly concessionsConcessionStandCalculationClient: concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewCalculationService") private readonly featurestoreFeatureViewCalculationClient: featurestoreFeatureViewCalculationServiceApi.FeatureViewCalculationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a profile.
   */
  async activateProfile(req: personalizationProfileLifecycleServiceApi.ActivateProfileRequest): Promise<personalizationProfileLifecycleServiceApi.ActivateProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateProfile", req);
    this.logger.info("activate_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserQueryServiceApi.LookupUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.details?.newOwner?.userId ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.identity.v1.LookupUserRequest",
      value: Buffer.from(identityUserQueryServiceApi.LookupUserRequest.encode(request1).finish()),
    });
    const unpacked1 = identityUserQueryServiceApi.LookupUserRequest.decode(envelope1.value);
    const invoke1: Unary<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse> =
      (input, done) => this.identityUserQueryClient.lookupUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse>(invoke1, unpacked1);
    const request2 = communityPostWorkflowServiceApi.RetryPostWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (reply1?.user?.relationshipManager?.email ?? "") } },
      post: {
        audit: { createdAt: reply1?.user?.audit?.createdAt },
        billingAddress: { postalCode: (reply1?.user?.primaryAddress?.postalCode ?? "") },
        counterparty: { displayName: (reply1?.user?.relationshipManager?.displayName ?? "") },
      },
    });
    const client2 = this.clients.get<communityPostWorkflowServiceApi.PostWorkflowServiceClient>("acme.community.v1.PostWorkflowService");
    const invoke2: Unary<communityPostWorkflowServiceApi.RetryPostWorkflowRequest, communityPostWorkflowServiceApi.RetryPostWorkflowResponse> =
      (input, done) => client2.retryPostWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostWorkflowServiceApi.RetryPostWorkflowRequest, communityPostWorkflowServiceApi.RetryPostWorkflowResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileLifecycleServiceApi.ActivateProfileResponse.fromPartial({
        profile: { contact: { email: (reply1?.user?.relationshipManager?.email ?? "") } },
      }),
      personalizationProfileLifecycleServiceApi.ActivateProfileResponse.fromPartial({
        profile: {
          primaryAddress: { lines: (reply2?.post?.billingAddress?.lines ?? []) },
          relationshipManager: { email: (reply2?.post?.counterparty?.email ?? "") },
        },
      }),
      personalizationProfileLifecycleServiceApi.ActivateProfileResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        profile: { profileId: (req?.profileId ?? "") },
      }),
    );
  }

  /**
   * Expires a profile.
   */
  async expireProfile(req: personalizationProfileLifecycleServiceApi.ExpireProfileRequest): Promise<personalizationProfileLifecycleServiceApi.ExpireProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireProfile", req);
    this.logger.info("expire_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.BrowseProfilesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke1: Unary<personalizationProfileQueryServiceApi.BrowseProfilesRequest, personalizationProfileQueryServiceApi.BrowseProfilesResponse> =
      (input, done) => this.personalizationProfileQueryClient.browseProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<personalizationProfileQueryServiceApi.BrowseProfilesRequest, personalizationProfileQueryServiceApi.BrowseProfilesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = personalizationProfileReportingServiceApi.CountProfileTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke2: Unary<personalizationProfileReportingServiceApi.CountProfileTotalsRequest, personalizationProfileReportingServiceApi.CountProfileTotalsResponse> =
      (input, done) => this.personalizationProfileReportingClient.countProfileTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<personalizationProfileReportingServiceApi.CountProfileTotalsRequest, personalizationProfileReportingServiceApi.CountProfileTotalsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileLifecycleServiceApi.ExpireProfileResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      personalizationProfileLifecycleServiceApi.ExpireProfileResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      personalizationProfileLifecycleServiceApi.ExpireProfileResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        profile: { profileId: (req?.profileId ?? "") },
      }),
    );
  }

  /**
   * Returns a profile.
   */
  async getProfileLifecycle(req: personalizationProfileLifecycleServiceApi.GetProfileLifecycleRequest): Promise<personalizationProfileLifecycleServiceApi.GetProfileLifecycleResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetProfileLifecycle", req);
    this.logger.info("get_profile_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest.fromPartial({
      affinity: { correlationId: (req?.profileId ?? "") },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const invoke1: Unary<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.checkAffinityEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("GetProfileLifecycle.CheckAffinityEligibility", () => call<personalizationAffinityValidationServiceApi.CheckAffinityEligibilityRequest, personalizationAffinityValidationServiceApi.CheckAffinityEligibilityResponse>(invoke1, request1));
    return mergeResponses(
      personalizationProfileLifecycleServiceApi.GetProfileLifecycleResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationProfileLifecycleServiceApi.GetProfileLifecycleResponse.fromPartial({ profile: { profileId: (req?.profileId ?? "") } }),
    );
  }

  /**
   * Reinstates a profile.
   */
  async reinstateProfile(req: personalizationProfileLifecycleServiceApi.ReinstateProfileRequest): Promise<personalizationProfileLifecycleServiceApi.ReinstateProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateProfile", req);
    this.logger.info("reinstate_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexQueryServiceApi.CountSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const invoke1: Unary<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.countSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = personalizationRecommendationQueryServiceApi.CountRecommendationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.details?.newOwner?.userId ?? ""),
      },
    });
    const reply2 = await this.workQueue.enqueue<personalizationRecommendationQueryServiceApi.CountRecommendationsRequest, personalizationRecommendationQueryServiceApi.CountRecommendationsResponse>(
      "acme.personalization.v1.ProfileLifecycleService/ReinstateProfile:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileLifecycleServiceApi.ReinstateProfileResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      personalizationProfileLifecycleServiceApi.ReinstateProfileResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      personalizationProfileLifecycleServiceApi.ReinstateProfileResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        profile: { profileId: (req?.profileId ?? "") },
      }),
    );
  }

  /**
   * Renews a profile.
   */
  async renewProfile(req: personalizationProfileLifecycleServiceApi.RenewProfileRequest): Promise<personalizationProfileLifecycleServiceApi.RenewProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewProfile", req);
    this.logger.info("renew_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.PreviewAffinityRequest.fromPartial({
      affinity: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
      details: { contact: { name: req?.details?.notifyContact?.name } },
    });
    const invoke1: Unary<personalizationAffinityValidationServiceApi.PreviewAffinityRequest, personalizationAffinityValidationServiceApi.PreviewAffinityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.previewAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<personalizationAffinityValidationServiceApi.PreviewAffinityRequest, personalizationAffinityValidationServiceApi.PreviewAffinityResponse>(invoke1, request1));
    const request2 = personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      recommendation: {
        counterparty: { email: (req?.details?.newOwner?.email ?? "") },
        recommendationId: (reply1?.affinity?.subject?.recommendationId ?? ""),
      },
    });
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest, personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.explainRecommendationDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileLifecycleServiceApi.RenewProfileResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      personalizationProfileLifecycleServiceApi.RenewProfileResponse.fromPartial({
        profile: {
          audit: { updatedAt: reply2?.recommendation?.audit?.updatedAt },
          primaryAddress: { locality: (reply2?.recommendation?.billingAddress?.locality ?? "") },
        },
      }),
      personalizationProfileLifecycleServiceApi.RenewProfileResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        profile: { profileId: (req?.profileId ?? "") },
      }),
    );
  }

  /**
   * Schedules a profile.
   */
  async scheduleProfileExpiry(req: personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryRequest): Promise<personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "ScheduleProfileExpiry", req);
    this.logger.info("schedule_profile_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featurestoreFeatureViewCalculationServiceApi.RecalculateFeatureViewsRequest.fromPartial({
      context: req?.context,
      featureView: {
        locator: { $case: "address", address: { countryCode: (req?.profile?.primaryAddress?.countryCode ?? "") } },
      },
    });
    const invoke1: Unary<featurestoreFeatureViewCalculationServiceApi.RecalculateFeatureViewsRequest, featurestoreFeatureViewCalculationServiceApi.RecalculateFeatureViewsResponse> =
      (input, done) => this.featurestoreFeatureViewCalculationClient.recalculateFeatureViews(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest.fromPartial({
      context: req?.context,
      recommendation: { audit: { updatedBy: (reply1?.featureView?.audit?.updatedBy ?? "") } },
    });
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest, personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.checkRecommendationEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandRequest.fromPartial({
      concessionStand: {
        components: { primary: {
          componentId: (reply1?.featureView?.components?.["primary"]?.componentId ?? ""),
        } },
      },
      context: req?.context,
      details: {
        destination: {
          recipient: ((reply1?.featureView?.locator?.$case === "address" ? reply1?.featureView?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const method3 = "calculateConcessionStand" as const;
    const invoke3: Unary<concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandRequest, concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandResponse> =
      (input, done) => this.concessionsConcessionStandCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandRequest, concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse.fromPartial({
        profile: {
          contact: { email: (reply3?.concessionStand?.owner?.email ?? "") },
          primaryAddress: {
            countryCode: ((reply3?.concessionStand?.locator?.$case === "address" ? reply3?.concessionStand?.locator.address : undefined)?.countryCode ?? ""),
          },
        },
      }),
      personalizationProfileLifecycleServiceApi.ScheduleProfileExpiryResponse.fromPartial({
        profile: {
          name: req?.profile?.name,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends a profile.
   */
  async suspendProfile(req: personalizationProfileLifecycleServiceApi.SuspendProfileRequest): Promise<personalizationProfileLifecycleServiceApi.SuspendProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendProfile", req);
    this.logger.info("suspend_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostApprovalServiceApi.EscalatePostRequest.fromPartial({
      context: req?.context,
      post: {
        counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const proxy1 = forwarding(this.communityPostApprovalClient);
    const invoke1: Unary<communityPostApprovalServiceApi.EscalatePostRequest, communityPostApprovalServiceApi.EscalatePostResponse> =
      (input, done) => proxy1.escalatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostApprovalServiceApi.EscalatePostRequest, communityPostApprovalServiceApi.EscalatePostResponse>(invoke1, request1);
    const request2 = communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest.fromPartial({
      badge: { audit: { updatedAt: reply1?.post?.audit?.updatedAt } },
      context: req?.context,
      details: {
        notify: {
          email: (reply1?.post?.counterparty?.email ?? ""),
          name: req?.details?.notifyContact?.name,
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.cancelBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityBadgeWorkflowServiceApi.CancelBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.CancelBadgeWorkflowResponse>(invoke2, request2);
    const request3 = communityPostApprovalServiceApi.RecallPostRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
      post: {
        billingAddress: { countryCode: (reply1?.post?.billingAddress?.countryCode ?? "") },
        settlement: { $case: "card", card: {
          token: ((reply1?.post?.settlement?.$case === "card" ? reply1?.post?.settlement.card : undefined)?.token ?? ""),
        } },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse> =
      (input, done) => this.communityPostApprovalClient.recallPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = catalogProductServiceApi.BatchGetProductsRequest.fromPartial({ context: input4?.context });
    const invoke4: Unary<catalogProductServiceApi.BatchGetProductsRequest, catalogProductServiceApi.BatchGetProductsResponse> =
      (input, done) => this.catalogProductClient.batchGetProducts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<catalogProductServiceApi.BatchGetProductsRequest, catalogProductServiceApi.BatchGetProductsResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileLifecycleServiceApi.SuspendProfileResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationProfileLifecycleServiceApi.SuspendProfileResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      personalizationProfileLifecycleServiceApi.SuspendProfileResponse.fromPartial({
        result: {
          referenceIds: (reply3?.result?.referenceIds ?? []),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      personalizationProfileLifecycleServiceApi.SuspendProfileResponse.fromPartial({
        result: {
          message: (reply4?.result?.message ?? ""),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      personalizationProfileLifecycleServiceApi.SuspendProfileResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        profile: { profileId: (req?.profileId ?? "") },
      }),
    );
  }

  /**
   * Terminates a profile.
   */
  async terminateProfile(req: personalizationProfileLifecycleServiceApi.TerminateProfileRequest): Promise<personalizationProfileLifecycleServiceApi.TerminateProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateProfile", req);
    this.logger.info("terminate_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest.fromPartial({
      context: req?.context,
      subscription: {
        action: { $case: "block", block: {
          notifyEmail: (req?.details?.newOwner?.email ?? ""),
          reason: (req?.reason ?? ""),
        } },
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
    });
    const cloned1: notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.PullSubscriptionsResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.pullSubscriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionSyncServiceApi.PullSubscriptionsRequest, notificationsSubscriptionSyncServiceApi.PullSubscriptionsResponse>(invoke1, cloned1);
    const request2 = communityModerationApprovalServiceApi.EscalateModerationRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.newOwner?.email ?? "") } },
      moderation: {
        assignee: { userId: (reply1?.subscription?.owner?.userId ?? "") },
        audit: { updatedBy: (reply1?.subscription?.audit?.updatedBy ?? "") },
      },
    });
    const decoded2 = communityModerationApprovalServiceApi.EscalateModerationRequest.fromJSON(
      JSON.parse(JSON.stringify(communityModerationApprovalServiceApi.EscalateModerationRequest.toJSON(request2))),
    );
    const invoke2: Unary<communityModerationApprovalServiceApi.EscalateModerationRequest, communityModerationApprovalServiceApi.EscalateModerationResponse> =
      (input, done) => this.communityModerationApprovalClient.escalateModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationApprovalServiceApi.EscalateModerationRequest, communityModerationApprovalServiceApi.EscalateModerationResponse>(invoke2, decoded2);
    const request3 = communityBadgeWorkflowServiceApi.SignalBadgeWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (reply1?.subscription?.owner?.email ?? ""),
          name: reply2?.moderation?.requester?.name,
          phone: (reply2?.moderation?.requester?.phone ?? ""),
        },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.SignalBadgeWorkflowRequest",
      value: Buffer.from(communityBadgeWorkflowServiceApi.SignalBadgeWorkflowRequest.encode(request3).finish()),
    });
    const unpacked3 = communityBadgeWorkflowServiceApi.SignalBadgeWorkflowRequest.decode(envelope3.value);
    const invoke3: Unary<communityBadgeWorkflowServiceApi.SignalBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse> =
      (input, done) => this.communityBadgeWorkflowClient.signalBadgeWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityBadgeWorkflowServiceApi.SignalBadgeWorkflowRequest, communityBadgeWorkflowServiceApi.SignalBadgeWorkflowResponse>(invoke3, unpacked3);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      personalizationProfileLifecycleServiceApi.TerminateProfileResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      personalizationProfileLifecycleServiceApi.TerminateProfileResponse.fromPartial({
        profile: {
          relationshipManager: { userId: (reply2?.moderation?.assignee?.userId ?? "") },
        },
      }),
      personalizationProfileLifecycleServiceApi.TerminateProfileResponse.fromPartial({ result: { message: (reply3?.outcome?.message ?? "") } }),
      personalizationProfileLifecycleServiceApi.TerminateProfileResponse.fromPartial({
        outcome: { effectiveAt: req?.details?.effectiveAt },
        profile: { profileId: (req?.profileId ?? "") },
      }),
    );
  }
}
