/**
 * Builds and schedules reports about affinities. Remote work stays behind typed client ports.
 */

import * as communityModerationApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as concessionsConcessionStandCalculationServiceApi from "../../../../.cache/proto/acme/concessions/v1/concession_stand_calculation_service.js";
import * as forecastingDemandForecastServiceApi from "../../../../.cache/proto/acme/forecasting/v1/demand_forecast_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as inventoryStockItemServiceApi from "../../../../.cache/proto/acme/inventory/v1/stock_item_service.js";
import * as licensingSoftwareLicenseCalculationServiceApi from "../../../../.cache/proto/acme/licensing/v1/software_license_calculation_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as sponsorshipsSponsorServiceApi from "../../../../.cache/proto/acme/sponsorships/v1/sponsor_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate affinity operations and persist audit data.
 */
@injectable()
export class AffinityReportingWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationApprovalService") private readonly communityModerationApprovalClient: communityModerationApprovalServiceApi.ModerationApprovalServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandCalculationService") private readonly concessionsConcessionStandCalculationClient: concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient,
    @inject("grpc:acme.forecasting.v1.DemandForecastService") private readonly forecastingDemandForecastClient: forecastingDemandForecastServiceApi.DemandForecastServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.inventory.v1.StockItemService") private readonly inventoryStockItemClient: inventoryStockItemServiceApi.StockItemServiceClient,
    @inject("grpc:acme.licensing.v1.SoftwareLicenseCalculationService") private readonly licensingSoftwareLicenseCalculationClient: licensingSoftwareLicenseCalculationServiceApi.SoftwareLicenseCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.sponsorships.v1.SponsorService") private readonly sponsorshipsSponsorClient: sponsorshipsSponsorServiceApi.SponsorServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Counts affinities by status.
   */
  async countAffinityTotals(req: personalizationAffinityReportingServiceApi.CountAffinityTotalsRequest): Promise<personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountAffinityTotals", req);
    this.logger.info("count_affinity_totals", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationAffinityReportingServiceApi.CountAffinityTotalsResponse.fromPartial({});
  }

  /**
   * Deletes an affinity.
   */
  async deleteAffinityReport(req: personalizationAffinityReportingServiceApi.DeleteAffinityReportRequest): Promise<personalizationAffinityReportingServiceApi.DeleteAffinityReportResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "DeleteAffinityReport", req);
    this.logger.info("delete_affinity_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.ValidateUserRequest.fromPartial({
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      reason: (req?.reason ?? ""),
      user: {
        audit: { etag: (req?.etag ?? "") },
        relationshipManager: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.identity.v1.ValidateUserRequest",
      value: Buffer.from(identityUserValidationServiceApi.ValidateUserRequest.encode(request1).finish()),
    });
    const unpacked1 = identityUserValidationServiceApi.ValidateUserRequest.decode(envelope1.value);
    const invoke1: Unary<identityUserValidationServiceApi.ValidateUserRequest, identityUserValidationServiceApi.ValidateUserResponse> =
      (input, done) => this.identityUserValidationClient.validateUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserValidationServiceApi.ValidateUserRequest, identityUserValidationServiceApi.ValidateUserResponse>(invoke1, unpacked1);
    const request2 = concessionsConcessionStandCalculationServiceApi.RecalculateConcessionStandsRequest.fromPartial({
      concessionStand: { audit: { updatedAt: reply1?.user?.audit?.updatedAt } },
      context: req?.context,
    });
    const client2 = this.clients.get<concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient>("acme.concessions.v1.ConcessionStandCalculationService");
    const invoke2: Unary<concessionsConcessionStandCalculationServiceApi.RecalculateConcessionStandsRequest, concessionsConcessionStandCalculationServiceApi.RecalculateConcessionStandsResponse> =
      (input, done) => client2.recalculateConcessionStands(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<concessionsConcessionStandCalculationServiceApi.RecalculateConcessionStandsRequest, concessionsConcessionStandCalculationServiceApi.RecalculateConcessionStandsResponse>(invoke2, request2);
    const request3 = forecastingDemandForecastServiceApi.SearchDemandForecastsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.user?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.user?.attributes ?? {}))),
        ownerId: (reply2?.concessionStand?.components?.["primary"]?.componentId ?? ""),
        region: (reply1?.user?.primaryAddress?.region ?? ""),
      },
    });
    const invoke3: Unary<forecastingDemandForecastServiceApi.SearchDemandForecastsRequest, forecastingDemandForecastServiceApi.SearchDemandForecastsResponse> =
      (input, done) => this.forecastingDemandForecastClient.searchDemandForecasts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port3: RequestPort<forecastingDemandForecastServiceApi.SearchDemandForecastsRequest, forecastingDemandForecastServiceApi.SearchDemandForecastsResponse> = new GrpcAdapter(invoke3);
    const reply3 = await port3.execute(request3);
    const request4 = licensingSoftwareLicenseCalculationServiceApi.RecalculateSoftwareLicensesRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: ((reply2?.concessionStand?.locator?.$case === "address" ? reply2?.concessionStand?.locator.address : undefined)?.locality ?? ""),
        },
      },
      softwareLicense: {
        holder: { displayName: (reply1?.user?.relationshipManager?.displayName ?? "") },
      },
    });
    const invoke4: Unary<licensingSoftwareLicenseCalculationServiceApi.RecalculateSoftwareLicensesRequest, licensingSoftwareLicenseCalculationServiceApi.RecalculateSoftwareLicensesResponse> =
      (input, done) => this.licensingSoftwareLicenseCalculationClient.recalculateSoftwareLicenses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await retry(() => call<licensingSoftwareLicenseCalculationServiceApi.RecalculateSoftwareLicensesRequest, licensingSoftwareLicenseCalculationServiceApi.RecalculateSoftwareLicensesResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.affinityId ?? "") });
    return mergeResponses(
      personalizationAffinityReportingServiceApi.DeleteAffinityReportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      personalizationAffinityReportingServiceApi.DeleteAffinityReportResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      personalizationAffinityReportingServiceApi.DeleteAffinityReportResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      personalizationAffinityReportingServiceApi.DeleteAffinityReportResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          referenceIds: (reply4?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Returns an affinity.
   */
  async fetchAffinityReport(req: personalizationAffinityReportingServiceApi.FetchAffinityReportRequest): Promise<personalizationAffinityReportingServiceApi.FetchAffinityReportResponse> {
    validateContext(req.context);
    if (!req.affinityId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "affinity_id is required");
    }
    await this.repository.record(req.context.tenantId, "FetchAffinityReport", req);
    this.logger.info("fetch_affinity_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest.fromPartial({
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const invoke1: Unary<personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest, personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.summarizeRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("FetchAffinityReport.SummarizeRecommendations", () => call<personalizationRecommendationQueryServiceApi.SummarizeRecommendationsRequest, personalizationRecommendationQueryServiceApi.SummarizeRecommendationsResponse>(invoke1, request1));
    return mergeResponses(
      personalizationAffinityReportingServiceApi.FetchAffinityReportResponse.fromPartial({
        affinity: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      personalizationAffinityReportingServiceApi.FetchAffinityReportResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } }),
    );
  }

  /**
   * Generates an affinity.
   */
  async generateAffinityReport(req: personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest): Promise<personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "GenerateAffinityReport", req);
    this.logger.info("generate_affinity_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.details?.filters ?? {}))),
      },
    });
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest, personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.countRecommendationTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest.fromPartial({
      affinity: {
        affinityId: (req?.affinityId ?? ""),
        correlationId: (reply1?.result?.correlationId ?? ""),
      },
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse>(
      "acme.personalization.v1.AffinityReportingService/GenerateAffinityReport:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Lists affinities a page at a time.
   */
  async listAffinityReports(req: personalizationAffinityReportingServiceApi.ListAffinityReportsRequest): Promise<personalizationAffinityReportingServiceApi.ListAffinityReportsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListAffinityReports", req);
    this.logger.info("list_affinity_reports", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = sponsorshipsSponsorServiceApi.ListSponsorsRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<sponsorshipsSponsorServiceApi.ListSponsorsRequest, sponsorshipsSponsorServiceApi.ListSponsorsResponse> =
      (input, done) => this.sponsorshipsSponsorClient.listSponsors(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<sponsorshipsSponsorServiceApi.ListSponsorsRequest, sponsorshipsSponsorServiceApi.ListSponsorsResponse>(invoke1, request1));
    const request2 = communityModerationApprovalServiceApi.RecallModerationRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
        comments: [{ createdAt: req?.filter?.createdAfter }],
        customFields: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
    });
    const invoke2: Unary<communityModerationApprovalServiceApi.RecallModerationRequest, communityModerationApprovalServiceApi.RecallModerationResponse> =
      (input, done) => this.communityModerationApprovalClient.recallModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<communityModerationApprovalServiceApi.RecallModerationResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      personalizationAffinityReportingServiceApi.ListAffinityReportsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      personalizationAffinityReportingServiceApi.ListAffinityReportsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Schedules an affinity.
   */
  async scheduleAffinityReport(req: personalizationAffinityReportingServiceApi.ScheduleAffinityReportRequest): Promise<personalizationAffinityReportingServiceApi.ScheduleAffinityReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ScheduleAffinityReport", req);
    this.logger.info("schedule_affinity_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { recipient: { email: (req?.context?.actor?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.shareRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      personalizationAffinityReportingServiceApi.ScheduleAffinityReportResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      personalizationAffinityReportingServiceApi.ScheduleAffinityReportResponse.fromPartial({ period: req?.details?.period }),
    );
  }

  /**
   * Shares an affinity.
   */
  async shareAffinityReport(req: personalizationAffinityReportingServiceApi.ShareAffinityReportRequest): Promise<personalizationAffinityReportingServiceApi.ShareAffinityReportResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ShareAffinityReport", req);
    this.logger.info("share_affinity_report", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest.fromPartial({
      context: req?.context,
      details: {
        channel: (req?.details?.channel ?? ""),
        recipient: { email: (req?.details?.recipient?.email ?? "") },
        templateId: (req?.details?.templateId ?? ""),
      },
    });
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.shareRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = inventoryStockItemServiceApi.CloneStockItemRequest.fromPartial({
      context: req?.context,
      stockItem: {
        locator: { $case: "address", address: {
          locality: (reply1?.recommendation?.billingAddress?.locality ?? ""),
          postalCode: (reply1?.recommendation?.billingAddress?.postalCode ?? ""),
        } },
        audit: { createdAt: reply1?.recommendation?.audit?.createdAt },
      },
    });
    const method2 = "cloneStockItem" as const;
    const invoke2: Unary<inventoryStockItemServiceApi.CloneStockItemRequest, inventoryStockItemServiceApi.CloneStockItemResponse> =
      (input, done) => this.inventoryStockItemClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<inventoryStockItemServiceApi.CloneStockItemRequest, inventoryStockItemServiceApi.CloneStockItemResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationAffinityReportingServiceApi.ShareAffinityReportResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      personalizationAffinityReportingServiceApi.ShareAffinityReportResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      personalizationAffinityReportingServiceApi.ShareAffinityReportResponse.fromPartial({ affinity: { affinityId: (req?.affinityId ?? "") } }),
    );
  }
}
