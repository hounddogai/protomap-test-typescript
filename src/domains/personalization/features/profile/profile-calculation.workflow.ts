/**
 * Computes the figures of a profile, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyValidationServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_validation_service.js";
import * as communityForumQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityPostQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as communityPostValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as modelregistryRegisteredModelCalculationServiceApi from "../../../../../.cache/proto/acme/modelregistry/v1/registered_model_calculation_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as googleTimestampApi from "../../../../../.cache/proto/google/protobuf/timestamp.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toProfileRecord } from "../../data/records.js";
import { PersonalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate profile operations and persist audit data.
 */
@injectable()
export class ProfileCalculationWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyValidationService") private readonly authorizationAccessPolicyValidationClient: authorizationAccessPolicyValidationServiceApi.AccessPolicyValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.modelregistry.v1.RegisteredModelCalculationService") private readonly modelregistryRegisteredModelCalculationClient: modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a profile.
   */
  async calculateProfile(req: personalizationProfileCalculationServiceApi.CalculateProfileRequest): Promise<personalizationProfileCalculationServiceApi.CalculateProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "CalculateProfile", req);
    this.logger.info("calculate_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.ExplainPostDecisionRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: {
          locality: (req?.profile?.primaryAddress?.locality ?? ""),
          recipient: (req?.profile?.primaryAddress?.recipient ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
    });
    const invoke1: Unary<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse> =
      (input, done) => this.communityPostValidationClient.explainPostDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>(
      "acme.personalization.v1.ProfileCalculationService/CalculateProfile:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      personalizationProfileCalculationServiceApi.CalculateProfileResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      personalizationProfileCalculationServiceApi.CalculateProfileResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      personalizationProfileCalculationServiceApi.CalculateProfileResponse.fromPartial({
        profile: {
          name: req?.profile?.name,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a profile.
   */
  async estimateProfile(req: personalizationProfileCalculationServiceApi.EstimateProfileRequest): Promise<personalizationProfileCalculationServiceApi.EstimateProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "EstimateProfile", req);
    this.logger.info("estimate_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumQueryServiceApi.SummarizeForumsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse> =
      (input, done) => this.communityForumQueryClient.summarizeForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse>(invoke1, request1));
    const request2 = authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyRequest.fromPartial({
      accessPolicy: {
        audit: { updatedAt: req?.profile?.audit?.updatedAt },
        owner: { displayName: (req?.profile?.relationshipManager?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyRequest, authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyValidationClient.normalizeAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<authorizationAccessPolicyValidationServiceApi.NormalizeAccessPolicyResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      personalizationProfileCalculationServiceApi.EstimateProfileResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      personalizationProfileCalculationServiceApi.EstimateProfileResponse.fromPartial({
        profile: { audit: { etag: (reply2?.accessPolicy?.audit?.etag ?? "") } },
      }),
      personalizationProfileCalculationServiceApi.EstimateProfileResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          relationshipManager: req?.profile?.relationshipManager,
        },
      }),
    );
  }

  /**
   * Explains a profile.
   */
  async explainProfileCalculation(req: personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest): Promise<personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "ExplainProfileCalculation", req);
    this.logger.info("explain_profile_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.ListFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.profile?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.profile?.attributes ?? {}))),
        ownerId: (req?.profile?.profileId ?? ""),
        region: (req?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagServiceApi.ListFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.ListFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.listFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_2: googleTimestampApi.Timestamp | undefined;
    switch (req?.profile?.identityDocument?.$case) {
      case "passport":
        selected2_2 = (req?.profile?.identityDocument?.$case === "passport" ? req?.profile?.identityDocument.passport : undefined)?.expiresAt;
        break;
      default:
        selected2_2 = undefined;
    }
    const request2 = searchSearchIndexQueryServiceApi.CountSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: selected2_2,
        labels: Object.fromEntries(Object.entries((req?.profile?.attributes ?? {}))),
        region: (req?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.countSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse>(invoke2, request2);
    const request3 = notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        correlationId: (reply2?.result?.correlationId ?? ""),
        subject: {
          displayName: (req?.profile?.relationshipManager?.displayName ?? ""),
          number: ((req?.profile?.identityDocument?.$case === "nationalId" ? req?.profile?.identityDocument.nationalId : undefined)?.number ?? ""),
        },
      },
      details: { authorEmail: (req?.profile?.contact?.email ?? "") },
    });
    const method3 = "recordDeliveryAttemptVersion" as const;
    const invoke3: Unary<notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse.fromPartial({ outcome: { nextSteps: (reply3?.outcome?.nextSteps ?? []) } }),
      personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          relationshipManager: req?.profile?.relationshipManager,
        },
      }),
    );
  }

  /**
   * Returns a profile.
   */
  async getProfileRates(req: personalizationProfileCalculationServiceApi.GetProfileRatesRequest): Promise<personalizationProfileCalculationServiceApi.GetProfileRatesResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetProfileRates", req);
    this.logger.info("get_profile_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: { createdAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const proxy1 = forwarding(this.notificationsSubscriptionCalculationClient);
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest, notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse> =
      (input, done) => proxy1.compareSubscriptionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsRequest, notificationsSubscriptionCalculationServiceApi.CompareSubscriptionOptionsResponse>(invoke1, request1);
    return mergeResponses(
      personalizationProfileCalculationServiceApi.GetProfileRatesResponse.fromPartial({
        profile: {
          audit: { createdBy: (reply1?.subscription?.audit?.createdBy ?? "") },
          relationshipManager: { userId: (reply1?.subscription?.owner?.userId ?? "") },
        },
      }),
      personalizationProfileCalculationServiceApi.GetProfileRatesResponse.fromPartial({ profile: { profileId: (req?.profileId ?? "") } }),
    );
  }

  /**
   * Recalculates a profile.
   */
  async recalculateProfiles(req: personalizationProfileCalculationServiceApi.RecalculateProfilesRequest): Promise<personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "RecalculateProfiles", req);
    this.logger.info("recalculate_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = modelregistryRegisteredModelCalculationServiceApi.RecalculateRegisteredModelsRequest.fromPartial({
      context: req?.context,
      registeredModel: { audit: { etag: (req?.profile?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<modelregistryRegisteredModelCalculationServiceApi.RecalculateRegisteredModelsRequest, modelregistryRegisteredModelCalculationServiceApi.RecalculateRegisteredModelsResponse> =
      (input, done) => this.modelregistryRegisteredModelCalculationClient.recalculateRegisteredModels(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<modelregistryRegisteredModelCalculationServiceApi.RecalculateRegisteredModelsRequest, modelregistryRegisteredModelCalculationServiceApi.RecalculateRegisteredModelsResponse>(invoke1, request1);
    const request2 = communityPostQueryServiceApi.BrowsePostsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.registeredModel?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
        ownerId: (reply1?.registeredModel?.components?.["primary"]?.componentId ?? ""),
        region: (req?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<communityPostQueryServiceApi.BrowsePostsRequest, communityPostQueryServiceApi.BrowsePostsResponse> =
      (input, done) => this.communityPostQueryClient.browsePosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostQueryServiceApi.BrowsePostsRequest, communityPostQueryServiceApi.BrowsePostsResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileCalculationServiceApi.RecalculateProfilesResponse.fromPartial({
        profile: {
          relationshipManager: { email: (reply1?.registeredModel?.owner?.email ?? "") },
        },
      }),
      personalizationProfileCalculationServiceApi.RecalculateProfilesResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      personalizationProfileCalculationServiceApi.RecalculateProfilesResponse.fromPartial({
        profile: {
          contact: { name: req?.profile?.name },
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a profile.
   */
  async simulateProfile(req: personalizationProfileCalculationServiceApi.SimulateProfileRequest): Promise<personalizationProfileCalculationServiceApi.SimulateProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "SimulateProfile", req);
    this.logger.info("simulate_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest.fromPartial({
      context: input1?.context,
      deliveryAttempt: {
        subject: {
          displayName: (input1?.profile?.relationshipManager?.displayName ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.recordDeliveryAttemptVersion(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionRequest, notificationsDeliveryAttemptHistoryServiceApi.RecordDeliveryAttemptVersionResponse>(invoke1, request1);
    const request2 = ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: req?.profile?.contact?.name,
          phone: (req?.profile?.contact?.phone ?? ""),
          preferredChannel: (req?.profile?.contact?.preferredChannel ?? ""),
        },
      },
      ledgerAccount: {
        holder: { displayName: (req?.profile?.relationshipManager?.displayName ?? "") },
      },
    });
    const cloned2: ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.normalizeLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>(invoke2, cloned2);
    const request3 = ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: { etag: (reply2?.ledgerAccount?.audit?.etag ?? "") },
        funding: { $case: "card", card: {
          network: ((reply2?.ledgerAccount?.funding?.$case === "card" ? reply2?.ledgerAccount?.funding.card : undefined)?.network ?? ""),
        } },
      },
    });
    const decoded3 = ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest.fromJSON(
      JSON.parse(JSON.stringify(ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest.toJSON(request3))),
    );
    const invoke3: Unary<ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest, ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.checkLedgerAccountEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest, ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileCalculationServiceApi.SimulateProfileResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      personalizationProfileCalculationServiceApi.SimulateProfileResponse.fromPartial({
        profile: {
          relationshipManager: { email: (reply2?.ledgerAccount?.contact?.email ?? "") },
        },
      }),
      personalizationProfileCalculationServiceApi.SimulateProfileResponse.fromPartial({
        profile: {
          audit: { updatedBy: (reply3?.ledgerAccount?.audit?.updatedBy ?? "") },
          relationshipManager: { displayName: (reply3?.ledgerAccount?.holder?.displayName ?? "") },
        },
      }),
      personalizationProfileCalculationServiceApi.SimulateProfileResponse.fromPartial({
        profile: {
          contact: req?.profile?.contact,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }
}
