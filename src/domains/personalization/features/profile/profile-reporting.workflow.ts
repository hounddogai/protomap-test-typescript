/**
 * Builds and schedules reports about profiles. Remote work stays behind typed client ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as devicesManagedDeviceServiceApi from "../../../../../.cache/proto/acme/devices/v1/managed_device_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { GrpcAdapter, call, forwarding, metadataFor, type RequestPort, type Unary } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { PersonalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate profile operations and persist audit data.
 */
@injectable()
export class ProfileReportingWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.devices.v1.ManagedDeviceService") private readonly devicesManagedDeviceClient: devicesManagedDeviceServiceApi.ManagedDeviceServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts profiles by status.
   */
  async countProfileTotals(req: personalizationProfileReportingServiceApi.CountProfileTotalsRequest): Promise<personalizationProfileReportingServiceApi.CountProfileTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountProfileTotals", req);
    this.logger.info("count_profile_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileReportingServiceApi.CountProfileTotalsResponse.fromPartial({});
  }

  /**
   * Deletes a profile.
   */
  async deleteProfileReport(req: personalizationProfileReportingServiceApi.DeleteProfileReportRequest): Promise<personalizationProfileReportingServiceApi.DeleteProfileReportResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteProfileReport", req);
    this.logger.info("delete_profile_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeApprovalServiceApi.ApproveBadgeRequest.fromPartial({
      badge: { action: { $case: "block", block: { reason: (req?.reason ?? "") } } },
      context: req?.context,
    });
    const proxy1 = forwarding(this.communityBadgeApprovalClient);
    const invoke1: Unary<communityBadgeApprovalServiceApi.ApproveBadgeRequest, communityBadgeApprovalServiceApi.ApproveBadgeResponse> =
      (input, done) => proxy1.approveBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityBadgeApprovalServiceApi.ApproveBadgeRequest, communityBadgeApprovalServiceApi.ApproveBadgeResponse>(invoke1, request1);
    const request2 = personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: {
          createdBy: (reply1?.badge?.audit?.createdBy ?? ""),
          updatedAt: reply1?.badge?.audit?.updatedAt,
        },
      },
    });
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest, personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.scoreRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest, personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse>(invoke2, request2);
    const request3 = personalizationRecommendationSyncServiceApi.PushRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: { locality: (reply2?.recommendation?.billingAddress?.locality ?? "") },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.pushRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.etag ?? "") });
    return mergeResponses(
      personalizationProfileReportingServiceApi.DeleteProfileReportResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationProfileReportingServiceApi.DeleteProfileReportResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      personalizationProfileReportingServiceApi.DeleteProfileReportResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
    );
  }

  /**
   * Returns a profile.
   */
  async fetchProfileReport(req: personalizationProfileReportingServiceApi.FetchProfileReportRequest): Promise<personalizationProfileReportingServiceApi.FetchProfileReportResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchProfileReport", req);
    this.logger.info("fetch_profile_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = personalizationAffinityCalculationServiceApi.EstimateAffinityRequest.fromPartial({
      affinity: {
        correlationId: (input1?.context?.actor?.userId ?? ""),
        occurredAt: input1?.context?.deadline,
        source: (input1?.profileId ?? ""),
      },
      context: input1?.context,
    });
    const invoke1: Unary<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.estimateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse>(invoke1, request1);
    return mergeResponses(
      personalizationProfileReportingServiceApi.FetchProfileReportResponse.fromPartial({
        profile: {
          relationshipManager: { displayName: (reply1?.affinity?.subject?.displayName ?? "") },
        },
        result: { correlationId: (reply1?.affinity?.correlationId ?? "") },
      }),
      personalizationProfileReportingServiceApi.FetchProfileReportResponse.fromPartial({ profile: { profileId: (req?.profileId ?? "") } }),
    );
  }

  /**
   * Generates a profile.
   */
  async generateProfileReport(req: personalizationProfileReportingServiceApi.GenerateProfileReportRequest): Promise<personalizationProfileReportingServiceApi.GenerateProfileReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateProfileReport", req);
    this.logger.info("generate_profile_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationQueryServiceApi.SuggestRecommendationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
        ownerId: (req?.context?.tenantId ?? ""),
      },
    });
    const cloned1: personalizationRecommendationQueryServiceApi.SuggestRecommendationsRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<personalizationRecommendationQueryServiceApi.SuggestRecommendationsRequest, personalizationRecommendationQueryServiceApi.SuggestRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.suggestRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationQueryServiceApi.SuggestRecommendationsRequest, personalizationRecommendationQueryServiceApi.SuggestRecommendationsResponse>(invoke1, cloned1);
    const request2 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
      recommendation: { counterparty: { email: (req?.context?.actor?.email ?? "") } },
    });
    const decoded2 = personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest.toJSON(request2))),
    );
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.estimateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationCalculationServiceApi.EstimateRecommendationRequest, personalizationRecommendationCalculationServiceApi.EstimateRecommendationResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      personalizationProfileReportingServiceApi.GenerateProfileReportResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      personalizationProfileReportingServiceApi.GenerateProfileReportResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      personalizationProfileReportingServiceApi.GenerateProfileReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists profiles a page at a time.
   */
  async listProfileReports(req: personalizationProfileReportingServiceApi.ListProfileReportsRequest): Promise<personalizationProfileReportingServiceApi.ListProfileReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListProfileReports", req);
    this.logger.info("list_profile_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileValidationServiceApi.NormalizeProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        primaryAddress: { region: (req?.filter?.region ?? "") },
        relationshipManager: { userId: (req?.context?.actor?.userId ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.NormalizeProfileRequest",
      value: Buffer.from(personalizationProfileValidationServiceApi.NormalizeProfileRequest.encode(request1).finish()),
    });
    const unpacked1 = personalizationProfileValidationServiceApi.NormalizeProfileRequest.decode(envelope1.value);
    const invoke1: Unary<personalizationProfileValidationServiceApi.NormalizeProfileRequest, personalizationProfileValidationServiceApi.NormalizeProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.normalizeProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileValidationServiceApi.NormalizeProfileRequest, personalizationProfileValidationServiceApi.NormalizeProfileResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileReportingServiceApi.ListProfileReportsResponse.fromPartial({
      profiles: [{
        primaryAddress: { recipient: (reply1?.profile?.primaryAddress?.recipient ?? "") },
      }],
    });
  }

  /**
   * Shares a profile.
   */
  async shareProfileReport(req: personalizationProfileReportingServiceApi.ShareProfileReportRequest): Promise<personalizationProfileReportingServiceApi.ShareProfileReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareProfileReport", req);
    this.logger.info("share_profile_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = devicesManagedDeviceServiceApi.UpdateManagedDeviceRequest.fromPartial({
      context: req?.context,
      managedDevice: {
        components: { primary: { componentId: (req?.details?.templateId ?? "") } },
        owner: {
          email: (req?.details?.recipient?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        specs: Object.fromEntries(Object.entries((req?.details?.variables ?? {}))),
      },
    });
    const client1 = this.clients.get<devicesManagedDeviceServiceApi.ManagedDeviceServiceClient>("acme.devices.v1.ManagedDeviceService");
    const invoke1: Unary<devicesManagedDeviceServiceApi.UpdateManagedDeviceRequest, devicesManagedDeviceServiceApi.UpdateManagedDeviceResponse> =
      (input, done) => client1.updateManagedDevice(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<devicesManagedDeviceServiceApi.UpdateManagedDeviceRequest, devicesManagedDeviceServiceApi.UpdateManagedDeviceResponse>(invoke1, request1);
    const request2 = personalizationRecommendationValidationServiceApi.ValidateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.recipient?.email ?? ""),
          name: req?.details?.recipient?.name,
        },
      },
      recommendation: {
        audit: { updatedAt: reply1?.managedDevice?.audit?.updatedAt },
        counterparty: { email: (reply1?.managedDevice?.owner?.email ?? "") },
      },
    });
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.ValidateRecommendationRequest, personalizationRecommendationValidationServiceApi.ValidateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.validateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<personalizationRecommendationValidationServiceApi.ValidateRecommendationRequest, personalizationRecommendationValidationServiceApi.ValidateRecommendationResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileReportingServiceApi.ShareProfileReportResponse.fromPartial({
        profile: {
          primaryAddress: {
            locality: ((reply1?.managedDevice?.locator?.$case === "address" ? reply1?.managedDevice?.locator.address : undefined)?.locality ?? ""),
          },
        },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      personalizationProfileReportingServiceApi.ShareProfileReportResponse.fromPartial({
        profile: {
          primaryAddress: {
            countryCode: (reply2?.recommendation?.billingAddress?.countryCode ?? ""),
          },
        },
      }),
      personalizationProfileReportingServiceApi.ShareProfileReportResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          relationshipManager: { email: (req?.details?.recipient?.email ?? "") },
        },
      }),
    );
  }
}
