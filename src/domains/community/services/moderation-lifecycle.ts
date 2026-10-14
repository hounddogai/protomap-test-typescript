/**
 * Moves a moderation between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceSyncValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as careplansCarePlanServiceApi from "../../../../.cache/proto/acme/careplans/v1/care_plan_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityModerationLifecycleServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as contentArticleQueryServiceApi from "../../../../.cache/proto/acme/content/v1/article_query_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as messagingChannelValidationServiceApi from "../../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
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
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toModerationRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate moderation operations and persist audit data.
 */
@injectable()
export class ModerationLifecycleWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceSyncValidationService") private readonly audiencesAudienceSyncValidationClient: audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient,
    @inject("grpc:acme.careplans.v1.CarePlanService") private readonly careplansCarePlanClient: careplansCarePlanServiceApi.CarePlanServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.content.v1.ArticleQueryService") private readonly contentArticleQueryClient: contentArticleQueryServiceApi.ArticleQueryServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.messaging.v1.ChannelValidationService") private readonly messagingChannelValidationClient: messagingChannelValidationServiceApi.ChannelValidationServiceClient,
    @inject("grpc:acme.messaging.v1.ChatMessageCalculationService") private readonly messagingChatMessageCalculationClient: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a moderation.
   */
  async activateModeration(req: communityModerationLifecycleServiceApi.ActivateModerationRequest): Promise<communityModerationLifecycleServiceApi.ActivateModerationResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateModeration", req);
    this.logger.info("activate_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      profile: {
        contact: { name: req?.details?.notifyContact?.name },
        relationshipManager: { email: (req?.details?.notifyContact?.email ?? "") },
      },
    });
    const invoke1: Unary<personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest, personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse> =
      (input, done) => this.personalizationProfileValidationClient.checkProfileEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest, personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse>(invoke1, request1);
    const request2 = personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: {
          locality: (reply1?.profile?.primaryAddress?.locality ?? ""),
          postalCode: (reply1?.profile?.primaryAddress?.postalCode ?? ""),
        },
        counterparty: {
          email: (req?.details?.newOwner?.email ?? ""),
          profileId: (reply1?.profile?.profileId ?? ""),
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.simulateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationLifecycleServiceApi.ActivateModerationResponse.fromPartial({
        moderation: {
          assignee: {
            displayName: (reply1?.profile?.relationshipManager?.displayName ?? ""),
          },
        },
      }),
      communityModerationLifecycleServiceApi.ActivateModerationResponse.fromPartial({
        moderation: { sla: { dueAt: reply2?.recommendation?.dueAt } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      communityModerationLifecycleServiceApi.ActivateModerationResponse.fromPartial({
        moderation: { moderationId: (req?.moderationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a moderation.
   */
  async expireModeration(req: communityModerationLifecycleServiceApi.ExpireModerationRequest): Promise<communityModerationLifecycleServiceApi.ExpireModerationResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireModeration", req);
    this.logger.info("expire_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityModerationValidationServiceApi.LintModerationsRequest.fromPartial({
      context: input1?.context,
      details: { contact: { phone: (input1?.details?.notifyContact?.phone ?? "") } },
      moderation: {
        origin: { $case: "customer", customer: { email: (input1?.details?.newOwner?.email ?? "") } },
      },
    });
    const invoke1: Unary<communityModerationValidationServiceApi.LintModerationsRequest, communityModerationValidationServiceApi.LintModerationsResponse> =
      (input, done) => this.communityModerationValidationClient.lintModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityModerationValidationServiceApi.LintModerationsRequest, communityModerationValidationServiceApi.LintModerationsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationLifecycleServiceApi.ExpireModerationResponse.fromPartial({
        moderation: { audit: { createdBy: (reply1?.moderation?.audit?.createdBy ?? "") } },
      }),
      communityModerationLifecycleServiceApi.ExpireModerationResponse.fromPartial({
        moderation: { moderationId: (req?.moderationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a moderation.
   */
  async getModerationLifecycle(req: communityModerationLifecycleServiceApi.GetModerationLifecycleRequest): Promise<communityModerationLifecycleServiceApi.GetModerationLifecycleResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetModerationLifecycle", req);
    this.logger.info("get_moderation_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest.fromPartial({
      context: req?.context,
      subscription: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const cloned1: notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest, notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse> =
      (input, done) => this.notificationsSubscriptionSyncClient.resolveSubscriptionConflict(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictRequest, notificationsSubscriptionSyncServiceApi.ResolveSubscriptionConflictResponse>(invoke1, cloned1);
    const request2 = contentArticleQueryServiceApi.CountArticlesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.subscription?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const decoded2 = contentArticleQueryServiceApi.CountArticlesRequest.fromJSON(
      JSON.parse(JSON.stringify(contentArticleQueryServiceApi.CountArticlesRequest.toJSON(request2))),
    );
    const invoke2: Unary<contentArticleQueryServiceApi.CountArticlesRequest, contentArticleQueryServiceApi.CountArticlesResponse> =
      (input, done) => this.contentArticleQueryClient.countArticles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentArticleQueryServiceApi.CountArticlesRequest, contentArticleQueryServiceApi.CountArticlesResponse>(invoke2, decoded2);
    const request3 = notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: { notifyEmail: (req?.context?.actor?.email ?? "") } },
        parameters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        scopes: (req?.context?.actor?.roles ?? []).map((value) => value),
      } },
      context: req?.context,
    });
    const stream3 = this.notificationsSubscriptionSyncClient.streamSubscriptionChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse.fromPartial({});
    return mergeResponses(
      communityModerationLifecycleServiceApi.GetModerationLifecycleResponse.fromPartial({
        moderation: { audit: { updatedBy: (reply1?.subscription?.audit?.updatedBy ?? "") } },
      }),
      communityModerationLifecycleServiceApi.GetModerationLifecycleResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      communityModerationLifecycleServiceApi.GetModerationLifecycleResponse.fromPartial({ moderation: { moderationId: (req?.moderationId ?? "") } }),
    );
  }

  /**
   * Reinstates a moderation.
   */
  async reinstateModeration(req: communityModerationLifecycleServiceApi.ReinstateModerationRequest): Promise<communityModerationLifecycleServiceApi.ReinstateModerationResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateModeration", req);
    this.logger.info("reinstate_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = careplansCarePlanServiceApi.CreateCarePlanRequest.fromPartial({
      carePlan: {
        audit: { updatedAt: req?.details?.effectiveAt },
        counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
        metadata: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      },
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.careplans.v1.CreateCarePlanRequest",
      value: Buffer.from(careplansCarePlanServiceApi.CreateCarePlanRequest.encode(request1).finish()),
    });
    const unpacked1 = careplansCarePlanServiceApi.CreateCarePlanRequest.decode(envelope1.value);
    const invoke1: Unary<careplansCarePlanServiceApi.CreateCarePlanRequest, careplansCarePlanServiceApi.CreateCarePlanResponse> =
      (input, done) => this.careplansCarePlanClient.createCarePlan(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<careplansCarePlanServiceApi.CreateCarePlanRequest, careplansCarePlanServiceApi.CreateCarePlanResponse>(invoke1, unpacked1);
    const request2 = identityUserQueryServiceApi.ResolveUsersRequest.fromPartial({ context: req?.context });
    const client2 = this.clients.get<identityUserQueryServiceApi.UserQueryServiceClient>("acme.identity.v1.UserQueryService");
    const invoke2: Unary<identityUserQueryServiceApi.ResolveUsersRequest, identityUserQueryServiceApi.ResolveUsersResponse> =
      (input, done) => client2.resolveUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserQueryServiceApi.ResolveUsersRequest, identityUserQueryServiceApi.ResolveUsersResponse>(invoke2, request2);
    const request3 = customersHouseholdQueryServiceApi.SuggestHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.carePlan?.issuedAt,
        region: (reply1?.carePlan?.billingAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<customersHouseholdQueryServiceApi.SuggestHouseholdsRequest, customersHouseholdQueryServiceApi.SuggestHouseholdsResponse> =
      (input, done) => this.customersHouseholdQueryClient.suggestHouseholds(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<customersHouseholdQueryServiceApi.SuggestHouseholdsRequest, customersHouseholdQueryServiceApi.SuggestHouseholdsResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationLifecycleServiceApi.ReinstateModerationResponse.fromPartial({
        moderation: { comments: [{ createdAt: reply1?.carePlan?.audit?.createdAt }] },
      }),
      communityModerationLifecycleServiceApi.ReinstateModerationResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      communityModerationLifecycleServiceApi.ReinstateModerationResponse.fromPartial({
        outcome: { message: (reply3?.result?.message ?? "") },
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
      }),
      communityModerationLifecycleServiceApi.ReinstateModerationResponse.fromPartial({
        moderation: { moderationId: (req?.moderationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Renews a moderation.
   */
  async renewModeration(req: communityModerationLifecycleServiceApi.RenewModerationRequest): Promise<communityModerationLifecycleServiceApi.RenewModerationResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewModeration", req);
    this.logger.info("renew_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.EstimateCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        contact: {
          email: (req?.details?.notifyContact?.email ?? ""),
          name: req?.details?.notifyContact?.name,
        },
        relationshipManager: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.estimateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<customersCustomerCalculationServiceApi.EstimateCustomerRequest, customersCustomerCalculationServiceApi.EstimateCustomerResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationLifecycleServiceApi.RenewModerationResponse.fromPartial({
        moderation: {
          assignee: {
            displayName: (reply1?.customer?.relationshipManager?.displayName ?? ""),
          },
        },
      }),
      communityModerationLifecycleServiceApi.RenewModerationResponse.fromPartial({
        moderation: { moderationId: (req?.moderationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a moderation.
   */
  async scheduleModerationExpiry(req: communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest): Promise<communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "ScheduleModerationExpiry", req);
    this.logger.info("schedule_moderation_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationValidationServiceApi.LintModerationsRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.notify?.name } },
    });
    const invoke1: Unary<communityModerationValidationServiceApi.LintModerationsRequest, communityModerationValidationServiceApi.LintModerationsResponse> =
      (input, done) => this.communityModerationValidationClient.lintModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ScheduleModerationExpiry.LintModerations", () => call<communityModerationValidationServiceApi.LintModerationsRequest, communityModerationValidationServiceApi.LintModerationsResponse>(invoke1, request1));
    const request2 = customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest.fromPartial({
      consentRecord: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: {
          displayName: ((reply1?.moderation?.origin?.$case === "customer" ? reply1?.moderation?.origin.customer : undefined)?.displayName ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest, customersConsentRecordValidationServiceApi.ScoreConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.scoreConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse.fromPartial({
        moderation: {
          audit: { updatedAt: reply1?.moderation?.audit?.updatedAt },
          requester: reply1?.moderation?.requester,
        },
      }),
      communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
      communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse.fromPartial({
        moderation: {
          assignee: req?.moderation?.assignee,
          moderationId: (req?.moderationId ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends a moderation.
   */
  async suspendModeration(req: communityModerationLifecycleServiceApi.SuspendModerationRequest): Promise<communityModerationLifecycleServiceApi.SuspendModerationResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendModeration", req);
    this.logger.info("suspend_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      chatMessage: { subject: { displayName: (req?.details?.newOwner?.displayName ?? "") } },
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest, messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse>(
      "acme.community.v1.ModerationLifecycleService/SuspendModeration:0", request1,
    );
    const request2 = audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest.fromPartial({
      audienceSync: {
        subject: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncValidationClient.previewAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.PreviewAudienceSyncResponse>(invoke2, request2));
    const request3 = messagingChannelValidationServiceApi.NormalizeChannelRequest.fromPartial({
      channel: { owner: { email: (req?.details?.notifyContact?.email ?? "") } },
      context: req?.context,
      details: { contact: { email: (req?.details?.newOwner?.email ?? "") } },
    });
    const invoke3: Unary<messagingChannelValidationServiceApi.NormalizeChannelRequest, messagingChannelValidationServiceApi.NormalizeChannelResponse> =
      (input, done) => this.messagingChannelValidationClient.normalizeChannel(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<messagingChannelValidationServiceApi.NormalizeChannelResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = communityForumServiceApi.ListForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.outcome?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply3?.result?.details ?? {}))),
        ownerId: (reply2?.audienceSync?.subject?.audienceMemberId ?? ""),
        region: ((reply3?.channel?.locator?.$case === "address" ? reply3?.channel?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke4: Unary<communityForumServiceApi.ListForumsRequest, communityForumServiceApi.ListForumsResponse> =
      (input, done) => this.communityForumClient.listForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.phone ?? "") });
    return mergeResponses(
      communityModerationLifecycleServiceApi.SuspendModerationResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      communityModerationLifecycleServiceApi.SuspendModerationResponse.fromPartial({
        moderation: {
          assignee: { displayName: (reply2?.audienceSync?.subject?.displayName ?? "") },
        },
      }),
      communityModerationLifecycleServiceApi.SuspendModerationResponse.fromPartial({ moderation: { audit: { etag: (reply3?.channel?.audit?.etag ?? "") } } }),
      communityModerationLifecycleServiceApi.SuspendModerationResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      communityModerationLifecycleServiceApi.SuspendModerationResponse.fromPartial({
        moderation: { moderationId: (req?.moderationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates a moderation.
   */
  async terminateModeration(req: communityModerationLifecycleServiceApi.TerminateModerationRequest): Promise<communityModerationLifecycleServiceApi.TerminateModerationResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateModeration", req);
    this.logger.info("terminate_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      notificationTemplate: {
        counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesRequest, notificationsNotificationTemplateCalculationServiceApi.RecalculateNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.recalculateNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      communityModerationLifecycleServiceApi.TerminateModerationResponse.fromPartial({
        moderation: {
          audit: { updatedBy: (reply1?.notificationTemplate?.audit?.updatedBy ?? "") },
          sla: { dueAt: reply1?.notificationTemplate?.dueAt },
        },
      }),
      communityModerationLifecycleServiceApi.TerminateModerationResponse.fromPartial({
        moderation: { moderationId: (req?.moderationId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}

/**
 * The gRPC boundary for ModerationLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class ModerationLifecycleHandler {
  constructor(@inject(ModerationLifecycleWorkflow) private readonly workflow: ModerationLifecycleWorkflow) {}

  /**
   * Activates a moderation.
   */
  activateModeration = unary<communityModerationLifecycleServiceApi.ActivateModerationRequest, communityModerationLifecycleServiceApi.ActivateModerationResponse>(
    (request) => this.workflow.activateModeration(request),
  );

  /**
   * Expires a moderation.
   */
  expireModeration = unary<communityModerationLifecycleServiceApi.ExpireModerationRequest, communityModerationLifecycleServiceApi.ExpireModerationResponse>(
    (request) => this.workflow.expireModeration(request),
  );

  /**
   * Returns a moderation.
   */
  getModerationLifecycle = (call: ServerUnaryCall<communityModerationLifecycleServiceApi.GetModerationLifecycleRequest, communityModerationLifecycleServiceApi.GetModerationLifecycleResponse>, done: sendUnaryData<communityModerationLifecycleServiceApi.GetModerationLifecycleResponse>): void => {
    void this.workflow.getModerationLifecycle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates a moderation.
   */
  reinstateModeration = unary<communityModerationLifecycleServiceApi.ReinstateModerationRequest, communityModerationLifecycleServiceApi.ReinstateModerationResponse>(
    (request) => this.workflow.reinstateModeration(request),
  );

  /**
   * Renews a moderation.
   */
  renewModeration = unary<communityModerationLifecycleServiceApi.RenewModerationRequest, communityModerationLifecycleServiceApi.RenewModerationResponse>(
    (request) => this.workflow.renewModeration(request),
  );

  /**
   * Schedules a moderation.
   */
  scheduleModerationExpiry = (call: ServerUnaryCall<communityModerationLifecycleServiceApi.ScheduleModerationExpiryRequest, communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse>, done: sendUnaryData<communityModerationLifecycleServiceApi.ScheduleModerationExpiryResponse>): void => {
    void this.workflow.scheduleModerationExpiry(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Suspends a moderation.
   */
  suspendModeration = unary<communityModerationLifecycleServiceApi.SuspendModerationRequest, communityModerationLifecycleServiceApi.SuspendModerationResponse>(
    (request) => this.workflow.suspendModeration(request),
  );

  /**
   * Terminates a moderation.
   */
  terminateModeration = unary<communityModerationLifecycleServiceApi.TerminateModerationRequest, communityModerationLifecycleServiceApi.TerminateModerationResponse>(
    (request) => this.workflow.terminateModeration(request),
  );
}

export function implementation(handler: ModerationLifecycleHandler): communityModerationLifecycleServiceApi.ModerationLifecycleServiceServer {
  return {
    activateModeration: handler.activateModeration,
    expireModeration: handler.expireModeration,
    getModerationLifecycle: handler.getModerationLifecycle,
    reinstateModeration: handler.reinstateModeration,
    renewModeration: handler.renewModeration,
    scheduleModerationExpiry: handler.scheduleModerationExpiry,
    suspendModeration: handler.suspendModeration,
    terminateModeration: handler.terminateModeration,
  };
}
