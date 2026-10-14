/**
 * Checks content revisions against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as contentContentBlockCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as contentContentBlockValidationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as featurestoreFeatureViewServiceApi from "../../../../../.cache/proto/acme/featurestore/v1/feature_view_service.js";
import * as formsFormSubmissionQueryServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as prescriptionsPrescriptionQueryServiceApi from "../../../../../.cache/proto/acme/prescriptions/v1/prescription_query_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  retry,
  type RequestPort,
  type Unary,
} from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toContentRevisionRecord } from "../../data/records.js";
import { ContentRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content revision operations and persist audit data.
 */
@injectable()
export class ContentRevisionValidationWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockValidationService") private readonly contentContentBlockValidationClient: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionCalculationService") private readonly contentContentRevisionCalculationClient: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewService") private readonly featurestoreFeatureViewClient: featurestoreFeatureViewServiceApi.FeatureViewServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionQueryService") private readonly formsFormSubmissionQueryClient: formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.prescriptions.v1.PrescriptionQueryService") private readonly prescriptionsPrescriptionQueryClient: prescriptionsPrescriptionQueryServiceApi.PrescriptionQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a content revision.
   */
  async checkContentRevisionEligibility(req: contentContentRevisionValidationServiceApi.CheckContentRevisionEligibilityRequest): Promise<contentContentRevisionValidationServiceApi.CheckContentRevisionEligibilityResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "CheckContentRevisionEligibility", req);
    this.logger.info("check_content_revision_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyQueryServiceApi.ExportTranslationKeysRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.contentRevision?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.contentRevision?.attributes ?? {}))),
        ownerId: (req?.contentRevision?.contentRevisionId ?? ""),
      },
    });
    const stream1 = this.localizationTranslationKeyQueryClient.exportTranslationKeys(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? localizationTranslationKeyQueryServiceApi.ExportTranslationKeysResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return contentContentRevisionValidationServiceApi.CheckContentRevisionEligibilityResponse.fromPartial({
      contentRevision: {
        contentRevisionId: (req?.contentRevisionId ?? ""),
        subject: req?.contentRevision?.subject,
      },
    });
  }

  /**
   * Explains a content revision.
   */
  async explainContentRevisionDecision(req: contentContentRevisionValidationServiceApi.ExplainContentRevisionDecisionRequest): Promise<contentContentRevisionValidationServiceApi.ExplainContentRevisionDecisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "ExplainContentRevisionDecision", req);
    this.logger.info("explain_content_revision_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<prescriptionsPrescriptionQueryServiceApi.FindPrescriptionsResponse>> = [];
    for (const item of (req?.contentRevision?.measurements ?? [])) {
      tasks1.push(async () => {
        const request1 = prescriptionsPrescriptionQueryServiceApi.FindPrescriptionsRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: item?.observedAt,
            ownerId: (req?.contentRevision?.contentRevisionId ?? ""),
          },
        });
        const invoke1: Unary<prescriptionsPrescriptionQueryServiceApi.FindPrescriptionsRequest, prescriptionsPrescriptionQueryServiceApi.FindPrescriptionsResponse> =
          (input, done) => this.prescriptionsPrescriptionQueryClient.findPrescriptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<prescriptionsPrescriptionQueryServiceApi.FindPrescriptionsRequest, prescriptionsPrescriptionQueryServiceApi.FindPrescriptionsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? prescriptionsPrescriptionQueryServiceApi.FindPrescriptionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return contentContentRevisionValidationServiceApi.ExplainContentRevisionDecisionResponse.fromPartial({
      contentRevision: { contentRevisionId: (req?.contentRevisionId ?? "") },
      result: { correlationId: (req?.contentRevision?.correlationId ?? "") },
    });
  }

  /**
   * Returns a content revision.
   */
  async getContentRevisionRules(req: contentContentRevisionValidationServiceApi.GetContentRevisionRulesRequest): Promise<contentContentRevisionValidationServiceApi.GetContentRevisionRulesResponse> {
    validateContext(req.context);
    if (!req.contentRevisionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "content_revision_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetContentRevisionRules", req);
    this.logger.info("get_content_revision_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    return contentContentRevisionValidationServiceApi.GetContentRevisionRulesResponse.fromPartial({
      contentRevision: { contentRevisionId: (req?.contentRevisionId ?? "") },
    });
  }

  /**
   * Lints a content revision.
   */
  async lintContentRevisions(req: contentContentRevisionValidationServiceApi.LintContentRevisionsRequest): Promise<contentContentRevisionValidationServiceApi.LintContentRevisionsResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "LintContentRevisions", req);
    this.logger.info("lint_content_revisions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.QuoteContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            manager: {
              displayName: (req?.contentRevision?.subject?.displayName ?? ""),
              email: (req?.contentRevision?.subject?.email ?? ""),
            },
          }],
          manager: { email: (req?.details?.contact?.email ?? "") },
        }],
      },
      context: req?.context,
    });
    const method1 = "quoteContentBlock" as const;
    const invoke1: Unary<contentContentBlockCalculationServiceApi.QuoteContentBlockRequest, contentContentBlockCalculationServiceApi.QuoteContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentBlockCalculationServiceApi.QuoteContentBlockRequest, contentContentBlockCalculationServiceApi.QuoteContentBlockResponse>(invoke1, request1);
    const request2 = contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { etag: (reply1?.contentBlock?.audit?.etag ?? "") },
            children: [{
              attributes: Object.fromEntries(Object.entries((req?.contentRevision?.attributes ?? {}))),
              location: reply1?.contentBlock?.location,
            }],
            location: { region: (reply1?.contentBlock?.location?.region ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const proxy2 = forwarding(this.contentContentBlockCalculationClient);
    const invoke2: Unary<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse> =
      (input, done) => proxy2.estimateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionValidationServiceApi.LintContentRevisionsResponse.fromPartial({
        contentRevision: {
          subject: { displayName: (reply1?.contentBlock?.manager?.displayName ?? "") },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionValidationServiceApi.LintContentRevisionsResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      contentContentRevisionValidationServiceApi.LintContentRevisionsResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          correlationId: (req?.contentRevision?.correlationId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a content revision.
   */
  async normalizeContentRevision(req: contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest): Promise<contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "NormalizeContentRevision", req);
    this.logger.info("normalize_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.contentRevision?.measurements ?? []).map(async (item) => {
      const request1 = contentContentRevisionCalculationServiceApi.SimulateContentRevisionRequest.fromPartial({
        contentRevision: { measurements: [{ metric: (item?.metric ?? "") }] },
        context: req?.context,
      });
      const invoke1: Unary<contentContentRevisionCalculationServiceApi.SimulateContentRevisionRequest, contentContentRevisionCalculationServiceApi.SimulateContentRevisionResponse> =
        (input, done) => this.contentContentRevisionCalculationClient.simulateContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<contentContentRevisionCalculationServiceApi.SimulateContentRevisionRequest, contentContentRevisionCalculationServiceApi.SimulateContentRevisionResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? contentContentRevisionCalculationServiceApi.SimulateContentRevisionResponse.fromPartial({});
    const request2 = formsFormSubmissionQueryServiceApi.CountFormSubmissionsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.contentRevision?.occurredAt },
    });
    const invoke2: Unary<formsFormSubmissionQueryServiceApi.CountFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.CountFormSubmissionsResponse> =
      (input, done) => this.formsFormSubmissionQueryClient.countFormSubmissions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionQueryServiceApi.CountFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.CountFormSubmissionsResponse>(invoke2, request2);
    const request3 = experimentsExperimentValidationServiceApi.PreviewExperimentRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      experiment: {
        organizer: { displayName: (reply1?.contentRevision?.subject?.displayName ?? "") },
        participants: [{
          contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
        }],
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse> =
      (input, done) => this.experimentsExperimentValidationClient.previewExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsExperimentValidationServiceApi.PreviewExperimentRequest, experimentsExperimentValidationServiceApi.PreviewExperimentResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse.fromPartial({
        outcome: { status: (reply3?.outcome?.status ?? "") },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          sequence: (req?.contentRevision?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Previews a content revision.
   */
  async previewContentRevision(req: contentContentRevisionValidationServiceApi.PreviewContentRevisionRequest): Promise<contentContentRevisionValidationServiceApi.PreviewContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "PreviewContentRevision", req);
    this.logger.info("preview_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest.fromPartial({
      context: input1?.context,
      reason: (input1?.reason ?? ""),
      subscription: {
        action: { $case: "block", block: { notifyEmail: (input1?.contentRevision?.subject?.email ?? "") } },
        owner: {
          displayName: (input1?.contentRevision?.subject?.displayName ?? ""),
          email: (input1?.details?.contact?.email ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.estimateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse>(invoke1, request1);
    const request2 = personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { createdBy: (reply1?.subscription?.audit?.createdBy ?? "") },
        counterparty: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const cloned2: personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.simulateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationCalculationServiceApi.SimulateRecommendationRequest, personalizationRecommendationCalculationServiceApi.SimulateRecommendationResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      contentContentRevisionValidationServiceApi.PreviewContentRevisionResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      contentContentRevisionValidationServiceApi.PreviewContentRevisionResponse.fromPartial({
        contentRevision: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      contentContentRevisionValidationServiceApi.PreviewContentRevisionResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          subject: req?.contentRevision?.subject,
        },
      }),
    );
  }

  /**
   * Scores a content revision.
   */
  async scoreContentRevision(req: contentContentRevisionValidationServiceApi.ScoreContentRevisionRequest): Promise<contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "ScoreContentRevision", req);
    this.logger.info("score_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockValidationServiceApi.LintContentBlocksRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries((req?.contentRevision?.attributes ?? {}))),
            }],
            location: {
              locality: (req?.details?.destination?.locality ?? ""),
              postalCode: (req?.details?.destination?.postalCode ?? ""),
              recipient: (req?.details?.destination?.recipient ?? ""),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const decoded1 = contentContentBlockValidationServiceApi.LintContentBlocksRequest.fromJSON(
      JSON.parse(JSON.stringify(contentContentBlockValidationServiceApi.LintContentBlocksRequest.toJSON(request1))),
    );
    const invoke1: Unary<contentContentBlockValidationServiceApi.LintContentBlocksRequest, contentContentBlockValidationServiceApi.LintContentBlocksResponse> =
      (input, done) => this.contentContentBlockValidationClient.lintContentBlocks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentBlockValidationServiceApi.LintContentBlocksRequest, contentContentBlockValidationServiceApi.LintContentBlocksResponse>(invoke1, decoded1);
    const request2 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { updatedAt: reply1?.contentBlock?.audit?.updatedAt },
            location: {
              countryCode: (req?.details?.destination?.countryCode ?? ""),
              postalCode: (reply1?.contentBlock?.location?.postalCode ?? ""),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.content.v1.ExplainContentBlockCalculationRequest",
      value: Buffer.from(contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.encode(request2).finish()),
    });
    const unpacked2 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.decode(envelope2.value);
    const invoke2: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
      (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>(invoke2, unpacked2);
    const request3 = featurestoreFeatureViewServiceApi.BatchGetFeatureViewsRequest.fromPartial({ context: req?.context });
    const client3 = this.clients.get<featurestoreFeatureViewServiceApi.FeatureViewServiceClient>("acme.featurestore.v1.FeatureViewService");
    const invoke3: Unary<featurestoreFeatureViewServiceApi.BatchGetFeatureViewsRequest, featurestoreFeatureViewServiceApi.BatchGetFeatureViewsResponse> =
      (input, done) => client3.batchGetFeatureViews(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<featurestoreFeatureViewServiceApi.BatchGetFeatureViewsRequest, featurestoreFeatureViewServiceApi.BatchGetFeatureViewsResponse>(invoke3, request3);
    const request4 = personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: { etag: (reply1?.contentBlock?.audit?.etag ?? "") },
        billingAddress: { postalCode: (reply1?.contentBlock?.location?.postalCode ?? "") },
        counterparty: { email: (reply2?.contentBlock?.manager?.email ?? "") },
      },
    });
    const invoke4: Unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.compareRecommendationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port4: RequestPort<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> = new GrpcAdapter(invoke4);
    const reply4 = await port4.execute(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse.fromPartial({
        contentRevision: { correlationId: (reply3?.result?.correlationId ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse.fromPartial({
        result: {
          details: (reply4?.result?.details ?? {}),
          status: (reply4?.result?.status ?? ""),
        },
      }),
      contentContentRevisionValidationServiceApi.ScoreContentRevisionResponse.fromPartial({
        contentRevision: {
          contentRevisionId: (req?.contentRevisionId ?? ""),
          subject: req?.contentRevision?.subject,
        },
      }),
    );
  }

  /**
   * Validates a content revision.
   */
  async validateContentRevision(req: contentContentRevisionValidationServiceApi.ValidateContentRevisionRequest): Promise<contentContentRevisionValidationServiceApi.ValidateContentRevisionResponse> {
    validateContext(req.context);
    if (req.contentRevision) {
      await this.repository.save(toContentRevisionRecord(req.context.tenantId, req.contentRevision));
    }
    await this.repository.record(req.context.tenantId, "ValidateContentRevision", req);
    this.logger.info("validate_content_revision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            manager: { displayName: (req?.contentRevision?.subject?.displayName ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
      (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentRevisionValidationServiceApi.ValidateContentRevisionResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      contentContentRevisionValidationServiceApi.ValidateContentRevisionResponse.fromPartial({
        contentRevision: {
          attributes: (req?.contentRevision?.attributes ?? {}),
          contentRevisionId: (req?.contentRevisionId ?? ""),
        },
      }),
    );
  }
}
