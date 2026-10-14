/**
 * Computes the figures of a translation key, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as auditAuditEventServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as communityForumQueryServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as experimentsExperimentServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as featureflagsFeatureFlagValidationServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_validation_service.js";
import * as featurestoreFeatureViewCalculationServiceApi from "../../../../../.cache/proto/acme/featurestore/v1/feature_view_calculation_service.js";
import * as lineageLineageNodeCalculationServiceApi from "../../../../../.cache/proto/acme/lineage/v1/lineage_node_calculation_service.js";
import * as lineageLineageNodeServiceApi from "../../../../../.cache/proto/acme/lineage/v1/lineage_node_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as notificationsNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as performersPerformerServiceApi from "../../../../../.cache/proto/acme/performers/v1/performer_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as searchSearchIndexServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_service.js";
import * as telematicsTelemetryReadingQueryServiceApi from "../../../../../.cache/proto/acme/telematics/v1/telemetry_reading_query_service.js";
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
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toTranslationKeyRecord } from "../../data/records.js";
import { LocalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation key operations and persist audit data.
 */
@injectable()
export class TranslationKeyCalculationWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagValidationService") private readonly featureflagsFeatureFlagValidationClient: featureflagsFeatureFlagValidationServiceApi.FeatureFlagValidationServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewCalculationService") private readonly featurestoreFeatureViewCalculationClient: featurestoreFeatureViewCalculationServiceApi.FeatureViewCalculationServiceClient,
    @inject("grpc:acme.lineage.v1.LineageNodeCalculationService") private readonly lineageLineageNodeCalculationClient: lineageLineageNodeCalculationServiceApi.LineageNodeCalculationServiceClient,
    @inject("grpc:acme.lineage.v1.LineageNodeService") private readonly lineageLineageNodeClient: lineageLineageNodeServiceApi.LineageNodeServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.performers.v1.PerformerService") private readonly performersPerformerClient: performersPerformerServiceApi.PerformerServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexService") private readonly searchSearchIndexClient: searchSearchIndexServiceApi.SearchIndexServiceClient,
    @inject("grpc:acme.telematics.v1.TelemetryReadingQueryService") private readonly telematicsTelemetryReadingQueryClient: telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a translation key.
   */
  async calculateTranslationKey(req: localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest): Promise<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "CalculateTranslationKey", req);
    this.logger.info("calculate_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexServiceApi.BatchGetSearchIndexesRequest.fromPartial({ context: req?.context });
    const decoded1 = searchSearchIndexServiceApi.BatchGetSearchIndexesRequest.fromJSON(
      JSON.parse(JSON.stringify(searchSearchIndexServiceApi.BatchGetSearchIndexesRequest.toJSON(request1))),
    );
    const invoke1: Unary<searchSearchIndexServiceApi.BatchGetSearchIndexesRequest, searchSearchIndexServiceApi.BatchGetSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexClient.batchGetSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<searchSearchIndexServiceApi.BatchGetSearchIndexesRequest, searchSearchIndexServiceApi.BatchGetSearchIndexesResponse>(invoke1, decoded1);
    const request2 = featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: {
          etag: (req?.translationKey?.audit?.etag ?? ""),
          updatedAt: req?.translationKey?.audit?.updatedAt,
          updatedBy: (req?.translationKey?.audit?.updatedBy ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.featureflags.v1.ExplainFeatureFlagDecisionRequest",
      value: Buffer.from(featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest.encode(request2).finish()),
    });
    const unpacked2 = featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest.decode(envelope2.value);
    const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest, featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.explainFeatureFlagDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest, featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionResponse>(invoke2, unpacked2);
    let selected3_1: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected3_1 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.recipient ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = experimentsExposureCalculationServiceApi.SimulateExposureRequest.fromPartial({
      context: req?.context,
      details: { destination: { recipient: (selected3_1 ?? "") } },
      exposure: {
        measurements: [{ unit: (req?.translationKey?.dimensions?.unit ?? "") }],
        subject: { displayName: (reply2?.featureFlag?.owner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse> =
      (input, done) => this.experimentsExposureCalculationClient.simulateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse>(invoke3, request3);
    const request4 = performersPerformerServiceApi.CreatePerformerRequest.fromPartial({
      context: req?.context,
      performer: {
        audit: {
          createdAt: reply2?.featureFlag?.audit?.createdAt,
          createdBy: (reply2?.featureFlag?.audit?.createdBy ?? ""),
        },
        primaryAddress: {
          lines: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.lines ?? []).map((value) => value),
        },
      },
    });
    const invoke4: Unary<performersPerformerServiceApi.CreatePerformerRequest, performersPerformerServiceApi.CreatePerformerResponse> =
      (input, done) => this.performersPerformerClient.createPerformer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<performersPerformerServiceApi.CreatePerformerRequest, performersPerformerServiceApi.CreatePerformerResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse.fromPartial({ translationKey: { owner: reply2?.featureFlag?.owner } }),
      localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse.fromPartial({
        translationKey: {
          specs: (req?.translationKey?.specs ?? {}),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a translation key.
   */
  async compareTranslationKeyOptions(req: localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsRequest): Promise<localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "CompareTranslationKeyOptions", req);
    this.logger.info("compare_translation_key_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureValidationServiceApi.NormalizeExposureRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.translationKey?.owner?.email ?? "") } },
      exposure: {
        measurements: [{ unit: (req?.translationKey?.dimensions?.unit ?? "") }],
        subject: { displayName: (req?.translationKey?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<experimentsExposureValidationServiceApi.NormalizeExposureRequest, experimentsExposureValidationServiceApi.NormalizeExposureResponse> =
      (input, done) => this.experimentsExposureValidationClient.normalizeExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<experimentsExposureValidationServiceApi.NormalizeExposureRequest, experimentsExposureValidationServiceApi.NormalizeExposureResponse>(invoke1, request1));
    const request2 = featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        owner: { displayName: (reply1?.exposure?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest, featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionResponse> =
      (input, done) => this.featureflagsFeatureFlagValidationClient.explainFeatureFlagDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CompareTranslationKeyOptions.ExplainFeatureFlagDecision", () => call<featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionRequest, featureflagsFeatureFlagValidationServiceApi.ExplainFeatureFlagDecisionResponse>(invoke2, request2));
    const request3 = experimentsExperimentServiceApi.BatchGetExperimentsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<experimentsExperimentServiceApi.BatchGetExperimentsRequest, experimentsExperimentServiceApi.BatchGetExperimentsResponse> =
      (input, done) => this.experimentsExperimentClient.batchGetExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse.fromPartial({
        breakdown: {
          lines: [{
            amount: (reply2?.featureFlag?.action?.$case === "discount" ? reply2?.featureFlag?.action.discount : undefined)?.amount,
          }],
        },
      }),
      localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      localizationTranslationKeyCalculationServiceApi.CompareTranslationKeyOptionsResponse.fromPartial({
        translationKey: {
          code: (req?.translationKey?.code ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a translation key.
   */
  async estimateTranslationKey(req: localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest): Promise<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "EstimateTranslationKey", req);
    this.logger.info("estimate_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featurestoreFeatureViewCalculationServiceApi.QuoteFeatureViewRequest.fromPartial({
      context: req?.context,
      featureView: {
        components: { primary: {
          componentId: (req?.translationKey?.components?.["primary"]?.componentId ?? ""),
        } },
      },
    });
    const reply1 = await this.workQueue.enqueue<featurestoreFeatureViewCalculationServiceApi.QuoteFeatureViewRequest, featurestoreFeatureViewCalculationServiceApi.QuoteFeatureViewResponse>(
      "acme.localization.v1.TranslationKeyCalculationService/EstimateTranslationKey:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse.fromPartial({
        translationKey: {
          components: { primary: {
            componentId: (reply1?.featureView?.components?.["primary"]?.componentId ?? ""),
          } },
        },
      }),
      localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse.fromPartial({
        translationKey: {
          code: (req?.translationKey?.code ?? ""),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a translation key.
   */
  async explainTranslationKeyCalculation(req: localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationRequest): Promise<localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "ExplainTranslationKeyCalculation", req);
    this.logger.info("explain_translation_key_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.ValidateAffinityRequest.fromPartial({
      affinity: {
        subject: { displayName: (req?.translationKey?.owner?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        contact: { email: (req?.details?.contact?.email ?? "") },
        rules: (req?.details?.rules ?? []).map((value) => value),
      },
    });
    const invoke1: Unary<personalizationAffinityValidationServiceApi.ValidateAffinityRequest, personalizationAffinityValidationServiceApi.ValidateAffinityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.validateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<personalizationAffinityValidationServiceApi.ValidateAffinityRequest, personalizationAffinityValidationServiceApi.ValidateAffinityResponse>(invoke1, request1));
    const request2 = lineageLineageNodeServiceApi.SearchLineageNodesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.translationKey?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.translationKey?.owner?.userId ?? ""),
        region: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.region ?? ""),
      },
    });
    const invoke2: Unary<lineageLineageNodeServiceApi.SearchLineageNodesRequest, lineageLineageNodeServiceApi.SearchLineageNodesResponse> =
      (input, done) => this.lineageLineageNodeClient.searchLineageNodes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<lineageLineageNodeServiceApi.SearchLineageNodesResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
      context: req?.context,
      profile: {
        relationshipManager: { displayName: (req?.translationKey?.owner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> =
      (input, done) => this.personalizationProfileCalculationClient.explainProfileCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse.fromPartial({
        result: { referenceIds: (reply3?.result?.referenceIds ?? []) },
        translationKey: { audit: { updatedBy: (reply3?.profile?.audit?.updatedBy ?? "") } },
      }),
      localizationTranslationKeyCalculationServiceApi.ExplainTranslationKeyCalculationResponse.fromPartial({
        translationKey: {
          owner: req?.translationKey?.owner,
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a translation key.
   */
  async getTranslationKeyRates(req: localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesRequest): Promise<localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesResponse> {
    validateContext(req.context);
    if (!req.translationKeyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_key_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranslationKeyRates", req);
    this.logger.info("get_translation_key_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = telematicsTelemetryReadingQueryServiceApi.ExportTelemetryReadingsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.translationKeyId ?? ""),
      },
    });
    const stream1 = this.telematicsTelemetryReadingQueryClient.exportTelemetryReadings(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? telematicsTelemetryReadingQueryServiceApi.ExportTelemetryReadingsResponse.fromPartial({});
    return localizationTranslationKeyCalculationServiceApi.GetTranslationKeyRatesResponse.fromPartial({ translationKey: { translationKeyId: (req?.translationKeyId ?? "") } });
  }

  /**
   * Quotes a translation key.
   */
  async quoteTranslationKey(req: localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyRequest): Promise<localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "QuoteTranslationKey", req);
    this.logger.info("quote_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumQueryServiceApi.BrowseForumsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.translationKey?.audit?.createdAt,
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke1: Unary<communityForumQueryServiceApi.BrowseForumsRequest, communityForumQueryServiceApi.BrowseForumsResponse> =
      (input, done) => this.communityForumQueryClient.browseForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = notificationsNotificationServiceApi.CreateNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (req?.translationKey?.owner?.displayName ?? "") },
      },
    });
    const method2 = "createNotification" as const;
    const invoke2: Unary<notificationsNotificationServiceApi.CreateNotificationRequest, notificationsNotificationServiceApi.CreateNotificationResponse> =
      (input, done) => this.notificationsNotificationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationServiceApi.CreateNotificationRequest, notificationsNotificationServiceApi.CreateNotificationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          details: (reply1?.result?.details ?? {}),
        },
      }),
      localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse.fromPartial({
        translationKey: {
          audit: { createdBy: (reply2?.notification?.audit?.createdBy ?? "") },
          owner: { userId: (reply2?.notification?.assignee?.userId ?? "") },
        },
      }),
      localizationTranslationKeyCalculationServiceApi.QuoteTranslationKeyResponse.fromPartial({
        translationKey: {
          capacity: (req?.translationKey?.capacity ?? 0),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a translation key.
   */
  async recalculateTranslationKeys(req: localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest): Promise<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> {
    validateContext(req.context);
    if (req.translationKey) {
      await this.repository.save(toTranslationKeyRecord(req.context.tenantId, req.translationKey));
    }
    await this.repository.record(req.context.tenantId, "RecalculateTranslationKeys", req);
    this.logger.info("recalculate_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesRequest.fromPartial({
      context: req?.context,
      lineageNode: {
        children: [{
          children: [{
            audit: { createdAt: req?.translationKey?.audit?.createdAt },
            location: {
              lines: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.lines ?? []).map((value) => value),
              locality: ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.locality ?? ""),
            },
            manager: { displayName: (req?.translationKey?.owner?.displayName ?? "") },
          }],
        }],
      },
    });
    const proxy1 = forwarding(this.lineageLineageNodeCalculationClient);
    const invoke1: Unary<lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesRequest, lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesResponse> =
      (input, done) => proxy1.recalculateLineageNodes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesRequest, lineageLineageNodeCalculationServiceApi.RecalculateLineageNodesResponse>(invoke1, request1);
    let selected2_2: string | undefined;
    switch (req?.translationKey?.locator?.$case) {
      case "address":
        selected2_2 = ((req?.translationKey?.locator?.$case === "address" ? req?.translationKey?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = personalizationProfileCalculationServiceApi.CalculateProfileRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (selected2_2 ?? ""),
          recipient: (reply1?.lineageNode?.location?.recipient ?? ""),
          region: (reply1?.lineageNode?.location?.region ?? ""),
        },
      },
      profile: {
        primaryAddress: { locality: (req?.details?.destination?.locality ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.calculateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(invoke2, request2);
    const request3 = auditAuditEventServiceApi.SearchAuditEventsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.lineageNode?.location?.region ?? "") },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<auditAuditEventServiceApi.SearchAuditEventsRequest, auditAuditEventServiceApi.SearchAuditEventsResponse> =
      (input, done) => this.auditAuditEventClient.searchAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<auditAuditEventServiceApi.SearchAuditEventsRequest, auditAuditEventServiceApi.SearchAuditEventsResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse.fromPartial({
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
        translationKey: { owner: { email: (reply1?.lineageNode?.manager?.email ?? "") } },
      }),
      localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse.fromPartial({
        translationKey: { owner: { email: (reply2?.profile?.relationshipManager?.email ?? "") } },
      }),
      localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse.fromPartial({
        result: {
          correlationId: (reply3?.result?.correlationId ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse.fromPartial({
        translationKey: {
          capacity: (req?.translationKey?.capacity ?? 0),
          translationKeyId: (req?.translationKeyId ?? ""),
        },
      }),
    );
  }
}
