/**
 * Manages profiles: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as commonContactApi from "../../../../.cache/proto/acme/common/v1/contact.js";
import * as communityBadgeValidationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumQueryServiceApi from "../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, retry, type Unary } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
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
export class ProfileWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeValidationService") private readonly communityBadgeValidationClient: communityBadgeValidationServiceApi.BadgeValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of profiles and answers once at the end.
   */
  async batchCreateProfiles(req: personalizationProfileServiceApi.BatchCreateProfilesRequest): Promise<personalizationProfileServiceApi.BatchCreateProfilesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateProfiles", req);
    this.logger.info("batch_create_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest.fromPartial({
      badge: {
        owner: {
          email: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.relationshipManager?.email ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse> =
      (input, done) => this.communityBadgeValidationClient.explainBadgeDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<communityBadgeValidationServiceApi.ExplainBadgeDecisionRequest, communityBadgeValidationServiceApi.ExplainBadgeDecisionResponse>(invoke1, request1));
    let selected2_2: commonContactApi.PersonName | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_2 = (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.contact?.name;
        break;
      default:
        selected2_2 = undefined;
    }
    let selected2_3: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected2_3 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.contact?.preferredChannel ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (reply1?.badge?.owner?.email ?? ""),
          name: selected2_2,
          preferredChannel: (selected2_3 ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.shareNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      personalizationProfileServiceApi.BatchCreateProfilesResponse.fromPartial({
        rejections: [{
          reason: ((reply1?.badge?.action?.$case === "block" ? reply1?.badge?.action.block : undefined)?.reason ?? ""),
        }],
        result: { message: (reply1?.result?.message ?? "") },
      }),
      personalizationProfileServiceApi.BatchCreateProfilesResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Returns several profiles at once.
   */
  async batchGetProfiles(req: personalizationProfileServiceApi.BatchGetProfilesRequest): Promise<personalizationProfileServiceApi.BatchGetProfilesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetProfiles", req);
    this.logger.info("batch_get_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.ScoreUserRequest.fromPartial({
      context: req?.context,
      user: {
        relationshipManager: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<identityUserValidationServiceApi.ScoreUserRequest, identityUserValidationServiceApi.ScoreUserResponse> =
      (input, done) => this.identityUserValidationClient.scoreUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return personalizationProfileServiceApi.BatchGetProfilesResponse.fromPartial({
      profiles: [{
        relationshipManager: {
          displayName: (reply1?.user?.relationshipManager?.displayName ?? ""),
          email: (reply1?.user?.relationshipManager?.email ?? ""),
        },
      }],
    });
  }

  /**
   * Creates a profile.
   */
  async cloneProfile(req: personalizationProfileServiceApi.CloneProfileRequest): Promise<personalizationProfileServiceApi.CloneProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "CloneProfile", req);
    this.logger.info("clone_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumQueryServiceApi.ExportForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (req?.profile?.identityDocument?.$case === "passport" ? req?.profile?.identityDocument.passport : undefined)?.expiresAt,
        ownerId: (req?.profile?.profileId ?? ""),
        region: (req?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const stream1 = this.communityForumQueryClient.exportForums(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? communityForumQueryServiceApi.ExportForumsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return personalizationProfileServiceApi.CloneProfileResponse.fromPartial({
      profile: {
        attributes: (req?.profile?.attributes ?? {}),
        name: req?.profile?.name,
      },
    });
  }

  /**
   * Creates a profile.
   */
  async createProfile(req: personalizationProfileServiceApi.CreateProfileRequest): Promise<personalizationProfileServiceApi.CreateProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "CreateProfile", req);
    this.logger.info("create_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeValidationServiceApi.NormalizeBadgeRequest.fromPartial({
      badge: { audit: { updatedBy: (req?.profile?.audit?.updatedBy ?? "") } },
      context: req?.context,
      details: {
        contact: {
          email: (req?.profile?.contact?.email ?? ""),
          name: req?.profile?.contact?.name,
          preferredChannel: (req?.profile?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<communityBadgeValidationServiceApi.NormalizeBadgeRequest, communityBadgeValidationServiceApi.NormalizeBadgeResponse>(
      "acme.personalization.v1.ProfileService/CreateProfile:0", request1,
    );
    const request2 = metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.profile?.audit?.createdAt,
        region: (req?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.browseMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      personalizationProfileServiceApi.CreateProfileResponse.fromPartial({
        profile: {
          audit: {
            createdAt: reply1?.badge?.audit?.createdAt,
            etag: (reply1?.badge?.audit?.etag ?? ""),
          },
        },
      }),
      personalizationProfileServiceApi.CreateProfileResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      personalizationProfileServiceApi.CreateProfileResponse.fromPartial({
        profile: {
          name: req?.profile?.name,
          primaryAddress: req?.profile?.primaryAddress,
        },
      }),
    );
  }

  /**
   * Deletes a profile.
   */
  async deleteProfile(req: personalizationProfileServiceApi.DeleteProfileRequest): Promise<personalizationProfileServiceApi.DeleteProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteProfile", req);
    this.logger.info("delete_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.shareNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return personalizationProfileServiceApi.DeleteProfileResponse.fromPartial({ effectiveAt: reply1?.outcome?.effectiveAt });
  }

  /**
   * Returns a profile.
   */
  async getProfile(req: personalizationProfileServiceApi.GetProfileRequest): Promise<personalizationProfileServiceApi.GetProfileResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetProfile", req);
    this.logger.info("get_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileValidationServiceApi.ScoreProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        profileId: (req?.profileId ?? ""),
        relationshipManager: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const invoke1: Unary<personalizationProfileValidationServiceApi.ScoreProfileRequest, personalizationProfileValidationServiceApi.ScoreProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.scoreProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      personalizationProfileServiceApi.GetProfileResponse.fromPartial({
        profile: {
          relationshipManager: { email: (reply1?.profile?.contact?.email ?? "") },
        },
      }),
      personalizationProfileServiceApi.GetProfileResponse.fromPartial({ profile: { profileId: (req?.profileId ?? "") } }),
    );
  }

  /**
   * Lists profiles a page at a time.
   */
  async listProfiles(req: personalizationProfileServiceApi.ListProfilesRequest): Promise<personalizationProfileServiceApi.ListProfilesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListProfiles", req);
    this.logger.info("list_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
      },
    });
    const invoke1: Unary<searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionRequest, searchSearchIndexValidationServiceApi.ExplainSearchIndexDecisionResponse> =
      (input, done) => this.searchSearchIndexValidationClient.explainSearchIndexDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileServiceApi.ListProfilesResponse.fromPartial({
      profiles: [{ audit: { updatedBy: (reply1?.searchIndex?.audit?.updatedBy ?? "") } }],
    });
  }

  /**
   * Lists profiles a page at a time.
   */
  async searchProfiles(req: personalizationProfileServiceApi.SearchProfilesRequest): Promise<personalizationProfileServiceApi.SearchProfilesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchProfiles", req);
    this.logger.info("search_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const method1 = "comparePostOptions" as const;
    const invoke1: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileServiceApi.SearchProfilesResponse.fromPartial({
      profiles: [{
        audit: {
          createdAt: reply1?.post?.audit?.createdAt,
          etag: (reply1?.post?.audit?.etag ?? ""),
        },
      }],
    });
  }

  /**
   * Changes a profile.
   */
  async updateProfile(req: personalizationProfileServiceApi.UpdateProfileRequest): Promise<personalizationProfileServiceApi.UpdateProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "UpdateProfile", req);
    this.logger.info("update_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityCalculationServiceApi.CalculateAffinityRequest.fromPartial({
      affinity: {
        subject: {
          number: ((req?.profile?.identityDocument?.$case === "nationalId" ? req?.profile?.identityDocument.nationalId : undefined)?.number ?? ""),
        },
      },
      context: req?.context,
      details: {
        destination: {
          lines: (req?.profile?.primaryAddress?.lines ?? []).map((value) => value),
        },
      },
    });
    const proxy1 = forwarding(this.personalizationAffinityCalculationClient);
    const invoke1: Unary<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse> =
      (input, done) => proxy1.calculateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse>(invoke1, request1);
    let selected2_1: string | undefined;
    switch (req?.profile?.identityDocument?.$case) {
      case "nationalId":
        selected2_1 = ((req?.profile?.identityDocument?.$case === "nationalId" ? req?.profile?.identityDocument.nationalId : undefined)?.number ?? "");
        break;
      default:
        selected2_1 = "";
    }
    const request2 = personalizationAffinityValidationServiceApi.NormalizeAffinityRequest.fromPartial({
      affinity: { subject: { number: (selected2_1 ?? "") } },
      context: req?.context,
      details: { contact: { phone: (req?.profile?.contact?.phone ?? "") } },
    });
    const invoke2: Unary<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.normalizeAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityValidationServiceApi.NormalizeAffinityRequest, personalizationAffinityValidationServiceApi.NormalizeAffinityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.profile?.audit?.etag ?? "") });
    return mergeResponses(
      personalizationProfileServiceApi.UpdateProfileResponse.fromPartial({
        profile: {
          relationshipManager: { displayName: (reply1?.affinity?.subject?.displayName ?? "") },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      personalizationProfileServiceApi.UpdateProfileResponse.fromPartial({
        profile: { attributes: (reply2?.affinity?.attributes ?? {}) },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      personalizationProfileServiceApi.UpdateProfileResponse.fromPartial({
        profile: {
          contact: req?.profile?.contact,
          primaryAddress: req?.profile?.primaryAddress,
        },
      }),
    );
  }

  /**
   * Streams the changes of profiles as they happen.
   */
  async watchProfiles(req: personalizationProfileServiceApi.WatchProfilesRequest): Promise<personalizationProfileServiceApi.WatchProfilesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchProfiles", req);
    this.logger.info("watch_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.subscriber?.preferredChannel ?? "") },
      },
      profile: { contact: { email: (req?.subscriber?.email ?? "") } },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest, personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse> =
      (input, done) => this.personalizationProfileValidationClient.checkProfileEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileValidationServiceApi.CheckProfileEligibilityRequest, personalizationProfileValidationServiceApi.CheckProfileEligibilityResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.filter?.region ?? "") });
    return mergeResponses(
      personalizationProfileServiceApi.WatchProfilesResponse.fromPartial({
        profile: {
          primaryAddress: { region: (reply1?.profile?.primaryAddress?.region ?? "") },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      personalizationProfileServiceApi.WatchProfilesResponse.fromPartial({
        profile: {
          contact: {
            name: req?.subscriber?.name,
            phone: (req?.subscriber?.phone ?? ""),
          },
        },
      }),
    );
  }
}
