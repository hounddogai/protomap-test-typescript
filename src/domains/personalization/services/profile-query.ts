/**
 * Answers read-only questions about profiles, for screens and reports. Remote work stays behind typed client ports.
 */

import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { serverStream, unary } from "../../../platform/handlers.js";
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
import { PersonalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate profile operations and persist audit data.
 */
@injectable()
export class ProfileQueryWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists profiles a page at a time.
   */
  async browseProfiles(req: personalizationProfileQueryServiceApi.BrowseProfilesRequest): Promise<personalizationProfileQueryServiceApi.BrowseProfilesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseProfiles", req);
    this.logger.info("browse_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      recommendation: { counterparty: { email: (req?.context?.actor?.email ?? "") } },
    });
    const client1 = this.clients.get<personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient>("acme.personalization.v1.RecommendationCalculationService");
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse> =
      (input, done) => client1.quoteRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationCalculationServiceApi.QuoteRecommendationRequest, personalizationRecommendationCalculationServiceApi.QuoteRecommendationResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileQueryServiceApi.BrowseProfilesResponse.fromPartial({
      profiles: [{ audit: { createdAt: reply1?.recommendation?.audit?.createdAt } }],
    });
  }

  /**
   * Counts profiles by status.
   */
  async countProfiles(req: personalizationProfileQueryServiceApi.CountProfilesRequest): Promise<personalizationProfileQueryServiceApi.CountProfilesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountProfiles", req);
    this.logger.info("count_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileQueryServiceApi.CountProfilesResponse.fromPartial({});
  }

  /**
   * Streams every matching profile.
   */
  async exportProfiles(req: personalizationProfileQueryServiceApi.ExportProfilesRequest): Promise<personalizationProfileQueryServiceApi.ExportProfilesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportProfiles", req);
    this.logger.info("export_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({
      context: req?.context,
      recommendation: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.compareRecommendationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { region: (reply1?.recommendation?.billingAddress?.region ?? "") },
      },
      recommendation: {
        audit: {
          createdBy: (reply1?.recommendation?.audit?.createdBy ?? ""),
          updatedAt: reply1?.recommendation?.audit?.updatedAt,
        },
      },
    });
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.calculateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      personalizationProfileQueryServiceApi.ExportProfilesResponse.fromPartial({
        profile: {
          primaryAddress: {
            postalCode: (reply1?.recommendation?.billingAddress?.postalCode ?? ""),
          },
        },
      }),
      personalizationProfileQueryServiceApi.ExportProfilesResponse.fromPartial({
        profile: {
          contact: { email: (reply2?.recommendation?.counterparty?.email ?? "") },
        },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      personalizationProfileQueryServiceApi.ExportProfilesResponse.fromPartial({ profile: { primaryAddress: { region: (req?.filter?.region ?? "") } } }),
    );
  }

  /**
   * Lists profiles a page at a time.
   */
  async findProfiles(req: personalizationProfileQueryServiceApi.FindProfilesRequest): Promise<personalizationProfileQueryServiceApi.FindProfilesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindProfiles", req);
    this.logger.info("find_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest, personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.recalculateRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("FindProfiles.RecalculateRecommendations", () => call<personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest, personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileQueryServiceApi.FindProfilesResponse.fromPartial({
      profiles: [{
        primaryAddress: { locality: (reply1?.recommendation?.billingAddress?.locality ?? "") },
      }],
    });
  }

  /**
   * Returns a profile.
   */
  async lookupProfile(req: personalizationProfileQueryServiceApi.LookupProfileRequest): Promise<personalizationProfileQueryServiceApi.LookupProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupProfile", req);
    this.logger.info("lookup_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.SimulateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        identityDocument: { $case: "passport", passport: { expiresAt: req?.context?.deadline } },
        relationshipManager: { userId: (req?.context?.actor?.userId ?? "") },
      },
      profileId: (req?.profileId ?? ""),
    });
    const invoke1: Unary<personalizationProfileCalculationServiceApi.SimulateProfileRequest, personalizationProfileCalculationServiceApi.SimulateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.simulateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = communityForumServiceApi.UpdateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: { region: (reply1?.profile?.primaryAddress?.region ?? "") },
            manager: { email: (reply1?.profile?.contact?.email ?? "") },
          }],
        }],
      },
    });
    const reply2 = await this.workQueue.enqueue<communityForumServiceApi.UpdateForumRequest, communityForumServiceApi.UpdateForumResponse>(
      "acme.personalization.v1.ProfileQueryService/LookupProfile:1", request2,
    );
    return mergeResponses(
      personalizationProfileQueryServiceApi.LookupProfileResponse.fromPartial({
        profile: {
          primaryAddress: { lines: (reply1?.profile?.primaryAddress?.lines ?? []) },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      personalizationProfileQueryServiceApi.LookupProfileResponse.fromPartial({
        profile: {
          audit: { updatedAt: reply2?.forum?.audit?.updatedAt },
          relationshipManager: { userId: (reply2?.forum?.manager?.userId ?? "") },
        },
      }),
      personalizationProfileQueryServiceApi.LookupProfileResponse.fromPartial({ profile: { profileId: (req?.profileId ?? "") } }),
    );
  }

  /**
   * Returns a profile.
   */
  async peekProfile(req: personalizationProfileQueryServiceApi.PeekProfileRequest): Promise<personalizationProfileQueryServiceApi.PeekProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekProfile", req);
    this.logger.info("peek_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    return personalizationProfileQueryServiceApi.PeekProfileResponse.fromPartial({ profile: { profileId: (req?.profileId ?? "") } });
  }

  /**
   * Returns several profiles at once.
   */
  async resolveProfiles(req: personalizationProfileQueryServiceApi.ResolveProfilesRequest): Promise<personalizationProfileQueryServiceApi.ResolveProfilesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveProfiles", req);
    this.logger.info("resolve_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.CountNotificationsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.context?.actor?.userId ?? "") },
    });
    const invoke1: Unary<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.countNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse>(invoke1, request1));
    const request2 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      profile: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        relationshipManager: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> =
      (input, done) => this.personalizationProfileCalculationClient.explainProfileCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      personalizationProfileQueryServiceApi.ResolveProfilesResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationProfileQueryServiceApi.ResolveProfilesResponse.fromPartial({
        profiles: [{
          contact: { email: (reply2?.profile?.contact?.email ?? "") },
          primaryAddress: { countryCode: (reply2?.profile?.primaryAddress?.countryCode ?? "") },
        }],
      }),
    );
  }

  /**
   * Lists profiles a page at a time.
   */
  async suggestProfiles(req: personalizationProfileQueryServiceApi.SuggestProfilesRequest): Promise<personalizationProfileQueryServiceApi.SuggestProfilesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestProfiles", req);
    this.logger.info("suggest_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      recommendation: {
        audit: { updatedAt: req?.filter?.createdAfter },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        metadata: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
      },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.calculateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileQueryServiceApi.SuggestProfilesResponse.fromPartial({
      profiles: [{
        relationshipManager: {
          displayName: (reply1?.recommendation?.counterparty?.displayName ?? ""),
        },
      }],
    });
  }

  /**
   * Summarizes a profile.
   */
  async summarizeProfiles(req: personalizationProfileQueryServiceApi.SummarizeProfilesRequest): Promise<personalizationProfileQueryServiceApi.SummarizeProfilesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeProfiles", req);
    this.logger.info("summarize_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.CountNotificationsRequest.fromPartial({
      context: req?.context,
      filter: { labels: Object.fromEntries(Object.entries((req?.annotations ?? {}))) },
    });
    const invoke1: Unary<notificationsNotificationQueryServiceApi.CountNotificationsRequest, notificationsNotificationQueryServiceApi.CountNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.countNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest.fromPartial({
      context: req?.context,
      profile: { contact: { email: (req?.context?.actor?.email ?? "") } },
      profileId: (req?.profileId ?? ""),
      reason: (req?.reason ?? ""),
    });
    const method2 = "explainProfileDecision" as const;
    const invoke2: Unary<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse> =
      (input, done) => this.personalizationProfileValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileValidationServiceApi.ExplainProfileDecisionRequest, personalizationProfileValidationServiceApi.ExplainProfileDecisionResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      personalizationProfileQueryServiceApi.SummarizeProfilesResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      personalizationProfileQueryServiceApi.SummarizeProfilesResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      personalizationProfileQueryServiceApi.SummarizeProfilesResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}

/**
 * The gRPC boundary for ProfileQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ProfileQueryHandler {
  constructor(@inject(ProfileQueryWorkflow) private readonly workflow: ProfileQueryWorkflow) {}

  /**
   * Lists profiles a page at a time.
   */
  browseProfiles = unary<personalizationProfileQueryServiceApi.BrowseProfilesRequest, personalizationProfileQueryServiceApi.BrowseProfilesResponse>(
    (request) => this.workflow.browseProfiles(request),
  );

  /**
   * Counts profiles by status.
   */
  countProfiles = unary<personalizationProfileQueryServiceApi.CountProfilesRequest, personalizationProfileQueryServiceApi.CountProfilesResponse>(
    (request) => this.workflow.countProfiles(request),
  );

  /**
   * Streams every matching profile.
   */
  exportProfiles = serverStream<personalizationProfileQueryServiceApi.ExportProfilesRequest, personalizationProfileQueryServiceApi.ExportProfilesResponse>(
    (request) => this.workflow.exportProfiles(request),
  );

  /**
   * Lists profiles a page at a time.
   */
  findProfiles = unary<personalizationProfileQueryServiceApi.FindProfilesRequest, personalizationProfileQueryServiceApi.FindProfilesResponse>(
    (request) => this.workflow.findProfiles(request),
  );

  /**
   * Returns a profile.
   */
  lookupProfile = unary<personalizationProfileQueryServiceApi.LookupProfileRequest, personalizationProfileQueryServiceApi.LookupProfileResponse>(
    (request) => this.workflow.lookupProfile(request),
  );

  /**
   * Returns a profile.
   */
  peekProfile = (call: ServerUnaryCall<personalizationProfileQueryServiceApi.PeekProfileRequest, personalizationProfileQueryServiceApi.PeekProfileResponse>, done: sendUnaryData<personalizationProfileQueryServiceApi.PeekProfileResponse>): void => {
    void this.workflow.peekProfile(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns several profiles at once.
   */
  resolveProfiles = unary<personalizationProfileQueryServiceApi.ResolveProfilesRequest, personalizationProfileQueryServiceApi.ResolveProfilesResponse>(
    (request) => this.workflow.resolveProfiles(request),
  );

  /**
   * Lists profiles a page at a time.
   */
  suggestProfiles = unary<personalizationProfileQueryServiceApi.SuggestProfilesRequest, personalizationProfileQueryServiceApi.SuggestProfilesResponse>(
    (request) => this.workflow.suggestProfiles(request),
  );

  /**
   * Summarizes a profile.
   */
  summarizeProfiles = (call: ServerUnaryCall<personalizationProfileQueryServiceApi.SummarizeProfilesRequest, personalizationProfileQueryServiceApi.SummarizeProfilesResponse>, done: sendUnaryData<personalizationProfileQueryServiceApi.SummarizeProfilesResponse>): void => {
    void this.workflow.summarizeProfiles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ProfileQueryHandler): personalizationProfileQueryServiceApi.ProfileQueryServiceServer {
  return {
    browseProfiles: handler.browseProfiles,
    countProfiles: handler.countProfiles,
    exportProfiles: handler.exportProfiles,
    findProfiles: handler.findProfiles,
    lookupProfile: handler.lookupProfile,
    peekProfile: handler.peekProfile,
    resolveProfiles: handler.resolveProfiles,
    suggestProfiles: handler.suggestProfiles,
    summarizeProfiles: handler.summarizeProfiles,
  };
}
