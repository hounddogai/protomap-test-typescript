/**
 * Answers read-only questions about audiences, for screens and reports. Remote work stays behind typed client ports.
 */

import * as audiencesAudienceMemberValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceQueryServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceSyncValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as documentsDocumentValidationServiceApi from "../../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as featurestoreFeatureViewQueryServiceApi from "../../../../.cache/proto/acme/featurestore/v1/feature_view_query_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as telematicsTelemetryReadingQueryServiceApi from "../../../../.cache/proto/acme/telematics/v1/telemetry_reading_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { AudiencesRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience operations and persist audit data.
 */
@injectable()
export class AudienceQueryWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberValidationService") private readonly audiencesAudienceMemberValidationClient: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncCalculationService") private readonly audiencesAudienceSyncCalculationClient: audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceSyncValidationService") private readonly audiencesAudienceSyncValidationClient: audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient,
    @inject("grpc:acme.documents.v1.DocumentValidationService") private readonly documentsDocumentValidationClient: documentsDocumentValidationServiceApi.DocumentValidationServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewQueryService") private readonly featurestoreFeatureViewQueryClient: featurestoreFeatureViewQueryServiceApi.FeatureViewQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptHistoryService") private readonly notificationsDeliveryAttemptHistoryClient: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingQueryService") private readonly telematicsTelemetryReadingQueryClient: telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists audiences a page at a time.
   */
  async browseAudiences(req: audiencesAudienceQueryServiceApi.BrowseAudiencesRequest): Promise<audiencesAudienceQueryServiceApi.BrowseAudiencesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseAudiences", req);
    this.logger.info("browse_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { measurements: [{ observedAt: req?.filter?.createdAfter }] },
      details: { authorEmail: (req?.context?.actor?.email ?? "") },
    });
    const invoke1: Unary<notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.CompareDeliveryAttemptVersionsResponse> =
      (input, done) => this.notificationsDeliveryAttemptHistoryClient.compareDeliveryAttemptVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceQueryServiceApi.BrowseAudiencesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } });
  }

  /**
   * Counts audiences by status.
   */
  async countAudiences(req: audiencesAudienceQueryServiceApi.CountAudiencesRequest): Promise<audiencesAudienceQueryServiceApi.CountAudiencesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountAudiences", req);
    this.logger.info("count_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = documentsDocumentValidationServiceApi.LintDocumentsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      document: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const method1 = "lintDocuments" as const;
    const invoke1: Unary<documentsDocumentValidationServiceApi.LintDocumentsRequest, documentsDocumentValidationServiceApi.LintDocumentsResponse> =
      (input, done) => this.documentsDocumentValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<documentsDocumentValidationServiceApi.LintDocumentsRequest, documentsDocumentValidationServiceApi.LintDocumentsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return audiencesAudienceQueryServiceApi.CountAudiencesResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } });
  }

  /**
   * Streams every matching audience.
   */
  async exportAudiences(req: audiencesAudienceQueryServiceApi.ExportAudiencesRequest): Promise<audiencesAudienceQueryServiceApi.ExportAudiencesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportAudiences", req);
    this.logger.info("export_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const proxy1 = forwarding(this.localizationTranslationKeyValidationClient);
    const invoke1: Unary<localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse> =
      (input, done) => proxy1.scoreTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyRequest, localizationTranslationKeyValidationServiceApi.ScoreTranslationKeyResponse>(invoke1, request1);
    const request2 = audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest.fromPartial({
      audienceMember: {
        audit: {
          etag: (reply1?.translationKey?.audit?.etag ?? ""),
          updatedAt: reply1?.translationKey?.audit?.updatedAt,
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.previewAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse>(invoke2, request2);
    const request3 = featurestoreFeatureViewQueryServiceApi.SummarizeFeatureViewsRequest.fromPartial({
      context: req?.context,
      details: {
        format: (req?.format ?? ""),
        period: reply2?.audienceMember?.preferences?.quietHours,
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<featurestoreFeatureViewQueryServiceApi.SummarizeFeatureViewsRequest, featurestoreFeatureViewQueryServiceApi.SummarizeFeatureViewsResponse> =
      (input, done) => this.featurestoreFeatureViewQueryClient.summarizeFeatureViews(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<featurestoreFeatureViewQueryServiceApi.SummarizeFeatureViewsRequest, featurestoreFeatureViewQueryServiceApi.SummarizeFeatureViewsResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      audiencesAudienceQueryServiceApi.ExportAudiencesResponse.fromPartial({
        audience: {
          audit: { updatedAt: reply1?.translationKey?.audit?.updatedAt },
          description: (reply1?.translationKey?.components?.["primary"]?.description ?? ""),
        },
      }),
      audiencesAudienceQueryServiceApi.ExportAudiencesResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      audiencesAudienceQueryServiceApi.ExportAudiencesResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
    );
  }

  /**
   * Returns an audience.
   */
  async lookupAudience(req: audiencesAudienceQueryServiceApi.LookupAudienceRequest): Promise<audiencesAudienceQueryServiceApi.LookupAudienceResponse> {
    validateContext(req.context);
    if (!req.audienceId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupAudience", req);
    this.logger.info("lookup_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = telematicsTelemetryReadingQueryServiceApi.SuggestTelemetryReadingsRequest.fromPartial({
      context: input1?.context,
      filter: { createdAfter: input1?.context?.deadline },
    });
    const invoke1: Unary<telematicsTelemetryReadingQueryServiceApi.SuggestTelemetryReadingsRequest, telematicsTelemetryReadingQueryServiceApi.SuggestTelemetryReadingsResponse> =
      (input, done) => this.telematicsTelemetryReadingQueryClient.suggestTelemetryReadings(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<telematicsTelemetryReadingQueryServiceApi.SuggestTelemetryReadingsRequest, telematicsTelemetryReadingQueryServiceApi.SuggestTelemetryReadingsResponse>(invoke1, request1);
    return mergeResponses(
      audiencesAudienceQueryServiceApi.LookupAudienceResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      audiencesAudienceQueryServiceApi.LookupAudienceResponse.fromPartial({ audience: { audienceId: (req?.audienceId ?? "") } }),
    );
  }

  /**
   * Returns an audience.
   */
  async peekAudience(req: audiencesAudienceQueryServiceApi.PeekAudienceRequest): Promise<audiencesAudienceQueryServiceApi.PeekAudienceResponse> {
    validateContext(req.context);
    if (!req.audienceId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekAudience", req);
    this.logger.info("peek_audience", { tenant: req.context.tenantId, trace: req.context.traceId });
    return audiencesAudienceQueryServiceApi.PeekAudienceResponse.fromPartial({ audience: { audienceId: (req?.audienceId ?? "") } });
  }

  /**
   * Returns several audiences at once.
   */
  async resolveAudiences(req: audiencesAudienceQueryServiceApi.ResolveAudiencesRequest): Promise<audiencesAudienceQueryServiceApi.ResolveAudiencesResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveAudiences", req);
    this.logger.info("resolve_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest.fromPartial({
      audienceMember: { relationshipManager: { email: (req?.context?.actor?.email ?? "") } },
      context: req?.context,
    });
    const cloned1: audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse> =
      (input, done) => this.audiencesAudienceMemberValidationClient.previewAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse>(invoke1, cloned1);
    const request2 = audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest.fromPartial({
      audienceSync: {
        subject: { email: (reply1?.audienceMember?.relationshipManager?.email ?? "") },
      },
      context: req?.context,
    });
    const decoded2 = audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest.fromJSON(
      JSON.parse(JSON.stringify(audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest.toJSON(request2))),
    );
    const invoke2: Unary<audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncValidationClient.scoreAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncRequest, audiencesAudienceSyncValidationServiceApi.ScoreAudienceSyncResponse>(invoke2, decoded2);
    return mergeResponses(
      audiencesAudienceQueryServiceApi.ResolveAudiencesResponse.fromPartial({
        audiences: [{ audit: { createdAt: reply1?.audienceMember?.audit?.createdAt } }],
        result: { status: (reply1?.result?.status ?? "") },
      }),
      audiencesAudienceQueryServiceApi.ResolveAudiencesResponse.fromPartial({
        result: {
          correlationId: (reply2?.audienceSync?.correlationId ?? ""),
          details: (reply2?.result?.details ?? {}),
        },
      }),
    );
  }

  /**
   * Lists audiences a page at a time.
   */
  async suggestAudiences(req: audiencesAudienceQueryServiceApi.SuggestAudiencesRequest): Promise<audiencesAudienceQueryServiceApi.SuggestAudiencesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestAudiences", req);
    this.logger.info("suggest_audiences", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audiences.v1.EstimateAudienceSyncRequest",
      value: Buffer.from(audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest.encode(request1).finish()),
    });
    const unpacked1 = audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest.decode(envelope1.value);
    const invoke1: Unary<audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse> =
      (input, done) => this.audiencesAudienceSyncCalculationClient.estimateAudienceSync(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncRequest, audiencesAudienceSyncCalculationServiceApi.EstimateAudienceSyncResponse>(invoke1, unpacked1);
    const request2 = audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberRequest.fromPartial({
      audienceMember: {
        relationshipManager: { email: (reply1?.audienceSync?.subject?.email ?? "") },
      },
      context: req?.context,
    });
    const client2 = this.clients.get<audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient>("acme.audiences.v1.AudienceMemberValidationService");
    const invoke2: Unary<audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse> =
      (input, done) => client2.scoreAudienceMember(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mergeResponses(
      audiencesAudienceQueryServiceApi.SuggestAudiencesResponse.fromPartial({
        result: {
          correlationId: (reply1?.audienceSync?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      audiencesAudienceQueryServiceApi.SuggestAudiencesResponse.fromPartial({
        audiences: [{ audit: { updatedAt: reply2?.audienceMember?.audit?.updatedAt } }],
        result: { message: (reply2?.result?.message ?? "") },
      }),
    );
  }
}
