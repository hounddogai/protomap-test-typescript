/**
 * Answers read-only questions about variants, for screens and reports. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as communityForumQueryServiceApi from "../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as concessionsConcessionStandServiceApi from "../../../../.cache/proto/acme/concessions/v1/concession_stand_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
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
import { collect, upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate variant operations and persist audit data.
 */
@injectable()
export class VariantQueryWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandService") private readonly concessionsConcessionStandClient: concessionsConcessionStandServiceApi.ConcessionStandServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentQueryService") private readonly experimentsExperimentQueryClient: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantCalculationService") private readonly experimentsVariantCalculationClient: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists variants a page at a time.
   */
  async browseVariants(req: experimentsVariantQueryServiceApi.BrowseVariantsRequest): Promise<experimentsVariantQueryServiceApi.BrowseVariantsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseVariants", req);
    this.logger.info("browse_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumQueryServiceApi.ExportForumsRequest.fromPartial({
      context: req?.context,
      filter: { query: (req?.filter?.query ?? "") },
    });
    const stream1 = this.communityForumQueryClient.exportForums(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? communityForumQueryServiceApi.ExportForumsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsVariantQueryServiceApi.BrowseVariantsResponse.fromPartial({});
  }

  /**
   * Counts variants by status.
   */
  async countVariants(req: experimentsVariantQueryServiceApi.CountVariantsRequest): Promise<experimentsVariantQueryServiceApi.CountVariantsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountVariants", req);
    this.logger.info("count_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.EstimateExposureRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const decoded1 = experimentsExposureCalculationServiceApi.EstimateExposureRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExposureCalculationServiceApi.EstimateExposureRequest.toJSON(request1))),
    );
    const invoke1: Unary<experimentsExposureCalculationServiceApi.EstimateExposureRequest, experimentsExposureCalculationServiceApi.EstimateExposureResponse> =
      (input, done) => this.experimentsExposureCalculationClient.estimateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExposureCalculationServiceApi.EstimateExposureRequest, experimentsExposureCalculationServiceApi.EstimateExposureResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsVariantQueryServiceApi.CountVariantsResponse.fromPartial({
      result: {
        correlationId: (reply1?.exposure?.correlationId ?? ""),
        message: (reply1?.result?.message ?? ""),
      },
    });
  }

  /**
   * Streams every matching variant.
   */
  async exportVariants(req: experimentsVariantQueryServiceApi.ExportVariantsRequest): Promise<experimentsVariantQueryServiceApi.ExportVariantsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportVariants", req);
    this.logger.info("export_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.LintAffinitiesRequest.fromPartial({
      affinity: { occurredAt: req?.filter?.createdAfter },
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.LintAffinitiesRequest",
      value: Buffer.from(personalizationAffinityValidationServiceApi.LintAffinitiesRequest.encode(request1).finish()),
    });
    const unpacked1 = personalizationAffinityValidationServiceApi.LintAffinitiesRequest.decode(envelope1.value);
    const invoke1: Unary<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse> =
      (input, done) => this.personalizationAffinityValidationClient.lintAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse>(invoke1, unpacked1);
    const request2 = notificationsNotificationServiceApi.BatchGetNotificationsRequest.fromPartial({ context: req?.context });
    const client2 = this.clients.get<notificationsNotificationServiceApi.NotificationServiceClient>("acme.notifications.v1.NotificationService");
    const invoke2: Unary<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse> =
      (input, done) => client2.batchGetNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      experimentsVariantQueryServiceApi.ExportVariantsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      experimentsVariantQueryServiceApi.ExportVariantsResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Lists variants a page at a time.
   */
  async findVariants(req: experimentsVariantQueryServiceApi.FindVariantsRequest): Promise<experimentsVariantQueryServiceApi.FindVariantsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindVariants", req);
    this.logger.info("find_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentQueryServiceApi.BrowseExperimentsRequest.fromPartial({
      context: req?.context,
      filter: {
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        ownerId: (req?.filter?.ownerId ?? ""),
        query: (req?.filter?.query ?? ""),
      },
      page: { pageToken: (req?.page?.pageToken ?? "") },
    });
    const invoke1: Unary<experimentsExperimentQueryServiceApi.BrowseExperimentsRequest, experimentsExperimentQueryServiceApi.BrowseExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.browseExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<experimentsExperimentQueryServiceApi.BrowseExperimentsRequest, experimentsExperimentQueryServiceApi.BrowseExperimentsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = experimentsExposureCalculationServiceApi.RecalculateExposuresRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
      exposure: {
        attributes: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        correlationId: (reply1?.result?.correlationId ?? ""),
        measurements: [{ observedAt: req?.filter?.createdAfter }],
      },
    });
    const invoke2: Unary<experimentsExposureCalculationServiceApi.RecalculateExposuresRequest, experimentsExposureCalculationServiceApi.RecalculateExposuresResponse> =
      (input, done) => this.experimentsExposureCalculationClient.recalculateExposures(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<experimentsExposureCalculationServiceApi.RecalculateExposuresRequest, experimentsExposureCalculationServiceApi.RecalculateExposuresResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      experimentsVariantQueryServiceApi.FindVariantsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      experimentsVariantQueryServiceApi.FindVariantsResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
    );
  }

  /**
   * Returns a variant.
   */
  async lookupVariant(req: experimentsVariantQueryServiceApi.LookupVariantRequest): Promise<experimentsVariantQueryServiceApi.LookupVariantResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupVariant", req);
    this.logger.info("lookup_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsVariantQueryServiceApi.LookupVariantResponse.fromPartial({ variant: { variantId: (req?.variantId ?? "") } });
  }

  /**
   * Returns a variant.
   */
  async peekVariant(req: experimentsVariantQueryServiceApi.PeekVariantRequest): Promise<experimentsVariantQueryServiceApi.PeekVariantResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekVariant", req);
    this.logger.info("peek_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    return experimentsVariantQueryServiceApi.PeekVariantResponse.fromPartial({ variant: { variantId: (req?.variantId ?? "") } });
  }

  /**
   * Returns several variants at once.
   */
  async resolveVariants(req: experimentsVariantQueryServiceApi.ResolveVariantsRequest): Promise<experimentsVariantQueryServiceApi.ResolveVariantsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveVariants", req);
    this.logger.info("resolve_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantCalculationServiceApi.QuoteVariantRequest.fromPartial({
      context: req?.context,
      variant: { owner: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<experimentsVariantCalculationServiceApi.QuoteVariantRequest, experimentsVariantCalculationServiceApi.QuoteVariantResponse> =
      (input, done) => this.experimentsVariantCalculationClient.quoteVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ResolveVariants.QuoteVariant", () => call<experimentsVariantCalculationServiceApi.QuoteVariantRequest, experimentsVariantCalculationServiceApi.QuoteVariantResponse>(invoke1, request1));
    return experimentsVariantQueryServiceApi.ResolveVariantsResponse.fromPartial({
      variants: [{
        audit: { updatedBy: (reply1?.variant?.audit?.updatedBy ?? "") },
        status: reply1?.variant?.status,
      }],
    });
  }

  /**
   * Lists variants a page at a time.
   */
  async suggestVariants(req: experimentsVariantQueryServiceApi.SuggestVariantsRequest): Promise<experimentsVariantQueryServiceApi.SuggestVariantsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestVariants", req);
    this.logger.info("suggest_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (req?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.ShareDeliveryAttemptExportResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient.shareDeliveryAttemptExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return experimentsVariantQueryServiceApi.SuggestVariantsResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } });
  }

  /**
   * Summarizes a variant.
   */
  async summarizeVariants(req: experimentsVariantQueryServiceApi.SummarizeVariantsRequest): Promise<experimentsVariantQueryServiceApi.SummarizeVariantsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeVariants", req);
    this.logger.info("summarize_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { locale: (req?.context?.locale ?? "") },
      reason: (req?.reason ?? ""),
    });
    const reply1 = await this.workQueue.enqueue<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>(
      "acme.experiments.v1.VariantQueryService/SummarizeVariants:0", request1,
    );
    const request2 = authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest.fromPartial({
      accessPolicy: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: { displayName: (reply1?.exposure?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest, authorizationAccessPolicyServiceApi.UpdateAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyClient.updateAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest, authorizationAccessPolicyServiceApi.UpdateAccessPolicyResponse>(invoke2, request2));
    const request3 = concessionsConcessionStandServiceApi.BatchCreateConcessionStandsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "record", record: {
        owner: {
          displayName: (reply1?.exposure?.subject?.displayName ?? ""),
          userId: (reply2?.accessPolicy?.owner?.userId ?? ""),
        },
      } },
    });
    const reply3 = await upload<concessionsConcessionStandServiceApi.BatchCreateConcessionStandsRequest, concessionsConcessionStandServiceApi.BatchCreateConcessionStandsResponse>(
      (done) => this.concessionsConcessionStandClient.batchCreateConcessionStands(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.details?.cron ?? "") });
    return mergeResponses(
      experimentsVariantQueryServiceApi.SummarizeVariantsResponse.fromPartial({
        result: {
          correlationId: (reply1?.exposure?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      experimentsVariantQueryServiceApi.SummarizeVariantsResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      experimentsVariantQueryServiceApi.SummarizeVariantsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
