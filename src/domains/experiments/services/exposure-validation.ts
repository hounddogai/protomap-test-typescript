/**
 * Checks exposures against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityPostQueryServiceApi from "../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
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
import { toExposureRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate exposure operations and persist audit data.
 */
@injectable()
export class ExposureValidationWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ModerationCalculationService") private readonly communityModerationCalculationClient: communityModerationCalculationServiceApi.ModerationCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagQueryService") private readonly featureflagsFeatureFlagQueryClient: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateHistoryService") private readonly notificationsNotificationTemplateHistoryClient: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks an exposure.
   */
  async checkExposureEligibility(req: experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest): Promise<experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "CheckExposureEligibility", req);
    this.logger.info("check_exposure_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureCalculationServiceApi.CalculateExposureRequest.fromPartial({
      context: req?.context,
      exposure: { correlationId: (req?.exposure?.correlationId ?? "") },
    });
    const invoke1: Unary<experimentsExposureCalculationServiceApi.CalculateExposureRequest, experimentsExposureCalculationServiceApi.CalculateExposureResponse> =
      (input, done) => this.experimentsExposureCalculationClient.calculateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CheckExposureEligibility.CalculateExposure", () => call<experimentsExposureCalculationServiceApi.CalculateExposureRequest, experimentsExposureCalculationServiceApi.CalculateExposureResponse>(invoke1, request1));
    const results2 = await Promise.all((req?.exposure?.measurements ?? []).map(async (item) => {
      const request2 = experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest.fromPartial({
        context: req?.context,
        variant: {
          audit: { createdAt: item?.observedAt },
          owner: { displayName: (req?.exposure?.subject?.displayName ?? "") },
        },
      });
      const invoke2: Unary<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse> =
        (input, done) => this.experimentsVariantValidationClient.checkVariantEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse.fromPartial({});
    const request3 = experimentsVariantValidationServiceApi.PreviewVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        audit: {
          etag: (reply2?.variant?.audit?.etag ?? ""),
          updatedAt: reply2?.variant?.audit?.updatedAt,
        },
        action: { $case: "block", block: {
          reason: ((reply2?.variant?.action?.$case === "block" ? reply2?.variant?.action.block : undefined)?.reason ?? ""),
        } },
      },
    });
    const invoke3: Unary<experimentsVariantValidationServiceApi.PreviewVariantRequest, experimentsVariantValidationServiceApi.PreviewVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.previewVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse.fromPartial({
        exposure: {
          exposureId: (reply1?.exposure?.exposureId ?? ""),
          sequence: (reply1?.exposure?.sequence ?? 0),
        },
      }),
      experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { status: (reply3?.result?.status ?? "") },
      }),
      experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse.fromPartial({
        exposure: {
          attributes: (req?.exposure?.attributes ?? {}),
          subject: req?.exposure?.subject,
        },
      }),
    );
  }

  /**
   * Explains an exposure.
   */
  async explainExposureDecision(req: experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest): Promise<experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ExplainExposureDecision", req);
    this.logger.info("explain_exposure_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest.fromPartial({
      context: req?.context,
      recommendation: {
        counterparty: { displayName: (req?.exposure?.subject?.displayName ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest, personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse>(
      "acme.experiments.v1.ExposureValidationService/ExplainExposureDecision:0", request1,
    );
    const request2 = experimentsVariantValidationServiceApi.ScoreVariantRequest.fromPartial({
      context: req?.context,
      variant: {
        owner: {
          displayName: (reply1?.recommendation?.counterparty?.displayName ?? ""),
          email: (reply1?.recommendation?.counterparty?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<experimentsVariantValidationServiceApi.ScoreVariantRequest, experimentsVariantValidationServiceApi.ScoreVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.scoreVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<experimentsVariantValidationServiceApi.ScoreVariantRequest, experimentsVariantValidationServiceApi.ScoreVariantResponse>(invoke2, request2));
    const settled3 = await Promise.allSettled((req?.exposure?.measurements ?? []).map(async (item) => {
      const request3 = experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest.fromPartial({
        context: req?.context,
        experiment: {
          audit: { updatedAt: item?.observedAt },
          location: {
            lines: (reply1?.recommendation?.billingAddress?.lines ?? []).map((value) => value),
          },
          participants: [{ contact: { phone: (req?.details?.contact?.phone ?? "") } }],
        },
      });
      const invoke3: Unary<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse> =
        (input, done) => this.experimentsExperimentValidationClient.explainExperimentDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<experimentsExperimentValidationServiceApi.ExplainExperimentDecisionRequest, experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? experimentsExperimentValidationServiceApi.ExplainExperimentDecisionResponse.fromPartial({});
    const request4 = experimentsExposureCalculationServiceApi.QuoteExposureRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (reply1?.recommendation?.billingAddress?.countryCode ?? ""),
          lines: (reply1?.recommendation?.billingAddress?.lines ?? []).map((value) => value),
          locality: (reply3?.experiment?.location?.locality ?? ""),
          recipient: (reply1?.recommendation?.billingAddress?.recipient ?? ""),
        },
      },
    });
    const invoke4: Unary<experimentsExposureCalculationServiceApi.QuoteExposureRequest, experimentsExposureCalculationServiceApi.QuoteExposureResponse> =
      (input, done) => this.experimentsExposureCalculationClient.quoteExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await new Promise<experimentsExposureCalculationServiceApi.QuoteExposureResponse>((resolve, reject) => {
      invoke4(request4, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse.fromPartial({
        exposure: {
          correlationId: (reply4?.exposure?.correlationId ?? ""),
          kind: (reply4?.exposure?.kind ?? ""),
        },
      }),
      experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          source: (req?.exposure?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Lints an exposure.
   */
  async lintExposures(req: experimentsExposureValidationServiceApi.LintExposuresRequest): Promise<experimentsExposureValidationServiceApi.LintExposuresResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "LintExposures", req);
    this.logger.info("lint_exposures", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.SimulateExperimentRequest.fromPartial({
      context: req?.context,
      experiment: {
        organizer: { email: (req?.details?.contact?.email ?? "") },
        participants: [{
          contact: {
            phone: (req?.details?.contact?.phone ?? ""),
            preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
          },
        }],
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.SimulateExperimentRequest, experimentsExperimentCalculationServiceApi.SimulateExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.simulateExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = communityModerationCalculationServiceApi.CompareModerationOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (reply1?.experiment?.location?.countryCode ?? "") },
      },
    });
    const invoke2: Unary<communityModerationCalculationServiceApi.CompareModerationOptionsRequest, communityModerationCalculationServiceApi.CompareModerationOptionsResponse> =
      (input, done) => this.communityModerationCalculationClient.compareModerationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureValidationServiceApi.LintExposuresResponse.fromPartial({
        exposure: { subject: { experimentId: (reply1?.experiment?.experimentId ?? "") } },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      experimentsExposureValidationServiceApi.LintExposuresResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      experimentsExposureValidationServiceApi.LintExposuresResponse.fromPartial({
        exposure: {
          attributes: (req?.exposure?.attributes ?? {}),
          exposureId: (req?.exposureId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes an exposure.
   */
  async normalizeExposure(req: experimentsExposureValidationServiceApi.NormalizeExposureRequest): Promise<experimentsExposureValidationServiceApi.NormalizeExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "NormalizeExposure", req);
    this.logger.info("normalize_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
      variant: { owner: { displayName: (req?.exposure?.subject?.displayName ?? "") } },
    });
    const method1 = "explainVariantDecision" as const;
    const invoke1: Unary<experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest, experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse> =
      (input, done) => this.experimentsVariantValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest, experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse>(invoke1, request1);
    const request2 = ledgerLedgerAccountValidationServiceApi.PreviewLedgerAccountRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
      ledgerAccount: {
        audit: { updatedAt: reply1?.variant?.audit?.updatedAt },
        contact: { phone: (req?.details?.contact?.phone ?? "") },
      },
    });
    const proxy2 = forwarding(this.ledgerLedgerAccountValidationClient);
    const invoke2: Unary<ledgerLedgerAccountValidationServiceApi.PreviewLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.PreviewLedgerAccountResponse> =
      (input, done) => proxy2.previewLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountValidationServiceApi.PreviewLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.PreviewLedgerAccountResponse>(invoke2, request2);
    const request3 = experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: reply2?.ledgerAccount?.contact?.name } },
      experiment: {
        participants: [{ contact: { email: (reply2?.ledgerAccount?.contact?.email ?? "") } }],
      },
    });
    const invoke3: Unary<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.explainExperimentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse>(invoke3, request3);
    const request4 = notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
      notificationTemplate: {
        audit: { etag: (reply3?.experiment?.audit?.etag ?? "") },
        billingAddress: { countryCode: (reply3?.experiment?.location?.countryCode ?? "") },
        lines: [{
          tax: {
            amount: (reply1?.variant?.action?.$case === "discount" ? reply1?.variant?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.explainNotificationTemplateCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse>(invoke4, spread4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureValidationServiceApi.NormalizeExposureResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      experimentsExposureValidationServiceApi.NormalizeExposureResponse.fromPartial({ outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") } }),
      experimentsExposureValidationServiceApi.NormalizeExposureResponse.fromPartial({ outcome: { status: (reply3?.outcome?.status ?? "") } }),
      experimentsExposureValidationServiceApi.NormalizeExposureResponse.fromPartial({
        outcome: { status: (reply4?.outcome?.status ?? "") },
        result: { status: (reply4?.result?.status ?? "") },
      }),
      experimentsExposureValidationServiceApi.NormalizeExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          sequence: (req?.exposure?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Previews an exposure.
   */
  async previewExposure(req: experimentsExposureValidationServiceApi.PreviewExposureRequest): Promise<experimentsExposureValidationServiceApi.PreviewExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "PreviewExposure", req);
    this.logger.info("preview_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityPostQueryServiceApi.FindPostsRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.exposure?.subject?.startsAt,
        ownerId: (input1?.exposure?.exposureId ?? ""),
      },
    });
    const invoke1: Unary<communityPostQueryServiceApi.FindPostsRequest, communityPostQueryServiceApi.FindPostsResponse> =
      (input, done) => this.communityPostQueryClient.findPosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostQueryServiceApi.FindPostsRequest, communityPostQueryServiceApi.FindPostsResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        counterparty: { displayName: (req?.exposure?.subject?.displayName ?? "") },
      },
    });
    const cloned2: notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse> =
      (input, done) => this.notificationsNotificationTemplateHistoryClient.compareNotificationTemplateVersions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse>(invoke2, cloned2);
    const request3 = experimentsVariantValidationServiceApi.NormalizeVariantRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
      variant: {
        owner: {
          displayName: (req?.exposure?.subject?.displayName ?? ""),
          email: (req?.details?.contact?.email ?? ""),
        },
        priority: (reply2?.notificationTemplate?.counterparty?.priority ?? 0),
      },
    });
    const decoded3 = experimentsVariantValidationServiceApi.NormalizeVariantRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsVariantValidationServiceApi.NormalizeVariantRequest.toJSON(request3))),
    );
    const invoke3: Unary<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.normalizeVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse>(invoke3, decoded3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureValidationServiceApi.PreviewExposureResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      experimentsExposureValidationServiceApi.PreviewExposureResponse.fromPartial({
        exposure: {
          subject: {
            displayName: (reply2?.notificationTemplate?.counterparty?.displayName ?? ""),
          },
        },
        outcome: { effectiveAt: reply2?.outcome?.effectiveAt },
      }),
      experimentsExposureValidationServiceApi.PreviewExposureResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      experimentsExposureValidationServiceApi.PreviewExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          occurredAt: req?.exposure?.occurredAt,
        },
      }),
    );
  }

  /**
   * Scores an exposure.
   */
  async scoreExposure(req: experimentsExposureValidationServiceApi.ScoreExposureRequest): Promise<experimentsExposureValidationServiceApi.ScoreExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ScoreExposure", req);
    this.logger.info("score_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityValidationServiceApi.LintAffinitiesRequest.fromPartial({
      affinity: {
        kind: (req?.exposure?.kind ?? ""),
        occurredAt: req?.exposure?.occurredAt,
        subject: { displayName: (req?.exposure?.subject?.displayName ?? "") },
      },
      context: req?.context,
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.LintAffinitiesRequest",
      value: Buffer.from(personalizationAffinityValidationServiceApi.LintAffinitiesRequest.encode(request1).finish()),
    });
    const unpacked1 = personalizationAffinityValidationServiceApi.LintAffinitiesRequest.decode(envelope1.value);
    const invoke1: Unary<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse> =
      (input, done) => this.personalizationAffinityValidationClient.lintAffinities(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse>(invoke1, unpacked1);
    const request2 = communityModerationCalculationServiceApi.CalculateModerationRequest.fromPartial({
      context: req?.context,
      moderation: {
        assignee: { displayName: (req?.exposure?.subject?.displayName ?? "") },
        origin: { $case: "customer", customer: { displayName: (reply1?.affinity?.subject?.displayName ?? "") } },
      },
    });
    const client2 = this.clients.get<communityModerationCalculationServiceApi.ModerationCalculationServiceClient>("acme.community.v1.ModerationCalculationService");
    const invoke2: Unary<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse> =
      (input, done) => client2.calculateModeration(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityModerationCalculationServiceApi.CalculateModerationRequest, communityModerationCalculationServiceApi.CalculateModerationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureValidationServiceApi.ScoreExposureResponse.fromPartial({
        exposure: { correlationId: (reply1?.affinity?.correlationId ?? "") },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      experimentsExposureValidationServiceApi.ScoreExposureResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      experimentsExposureValidationServiceApi.ScoreExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          source: (req?.exposure?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Validates an exposure.
   */
  async validateExposure(req: experimentsExposureValidationServiceApi.ValidateExposureRequest): Promise<experimentsExposureValidationServiceApi.ValidateExposureResponse> {
    validateContext(req.context);
    if (req.exposure) {
      await this.repository.save(toExposureRecord(req.context.tenantId, req.exposure));
    }
    await this.repository.record(req.context.tenantId, "ValidateExposure", req);
    this.logger.info("validate_exposure", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantValidationServiceApi.NormalizeVariantRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.contact?.name } },
      variant: { owner: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke1: Unary<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.normalizeVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.exposure?.subject?.startsAt,
        ownerId: (reply1?.outcome?.referenceId ?? ""),
      },
    });
    const invoke2: Unary<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagQueryClient.suggestFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExposureValidationServiceApi.ValidateExposureResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      experimentsExposureValidationServiceApi.ValidateExposureResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      experimentsExposureValidationServiceApi.ValidateExposureResponse.fromPartial({
        exposure: {
          exposureId: (req?.exposureId ?? ""),
          occurredAt: req?.exposure?.occurredAt,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ExposureValidationService; workflows own validation and database transactions.
 */
@injectable()
export class ExposureValidationHandler {
  constructor(@inject(ExposureValidationWorkflow) private readonly workflow: ExposureValidationWorkflow) {}

  /**
   * Checks an exposure.
   */
  checkExposureEligibility = unary<experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest, experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse>(
    (request) => this.workflow.checkExposureEligibility(request),
  );

  /**
   * Explains an exposure.
   */
  explainExposureDecision = unary<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse>(
    (request) => this.workflow.explainExposureDecision(request),
  );

  /**
   * Lints an exposure.
   */
  lintExposures = (call: ServerUnaryCall<experimentsExposureValidationServiceApi.LintExposuresRequest, experimentsExposureValidationServiceApi.LintExposuresResponse>, done: sendUnaryData<experimentsExposureValidationServiceApi.LintExposuresResponse>): void => {
    void this.workflow.lintExposures(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes an exposure.
   */
  normalizeExposure = unary<experimentsExposureValidationServiceApi.NormalizeExposureRequest, experimentsExposureValidationServiceApi.NormalizeExposureResponse>(
    (request) => this.workflow.normalizeExposure(request),
  );

  /**
   * Previews an exposure.
   */
  previewExposure = unary<experimentsExposureValidationServiceApi.PreviewExposureRequest, experimentsExposureValidationServiceApi.PreviewExposureResponse>(
    (request) => this.workflow.previewExposure(request),
  );

  /**
   * Scores an exposure.
   */
  scoreExposure = (call: ServerUnaryCall<experimentsExposureValidationServiceApi.ScoreExposureRequest, experimentsExposureValidationServiceApi.ScoreExposureResponse>, done: sendUnaryData<experimentsExposureValidationServiceApi.ScoreExposureResponse>): void => {
    void this.workflow.scoreExposure(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates an exposure.
   */
  validateExposure = unary<experimentsExposureValidationServiceApi.ValidateExposureRequest, experimentsExposureValidationServiceApi.ValidateExposureResponse>(
    (request) => this.workflow.validateExposure(request),
  );
}

export function implementation(handler: ExposureValidationHandler): experimentsExposureValidationServiceApi.ExposureValidationServiceServer {
  return {
    checkExposureEligibility: handler.checkExposureEligibility,
    explainExposureDecision: handler.explainExposureDecision,
    lintExposures: handler.lintExposures,
    normalizeExposure: handler.normalizeExposure,
    previewExposure: handler.previewExposure,
    scoreExposure: handler.scoreExposure,
    validateExposure: handler.validateExposure,
  };
}
