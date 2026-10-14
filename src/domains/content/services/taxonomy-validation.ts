/**
 * Checks taxonomies against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as contentArticleValidationServiceApi from "../../../../.cache/proto/acme/content/v1/article_validation_service.js";
import * as contentContentBlockValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as contentContentRevisionValidationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as contentTaxonomyValidationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as formsFormQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as personalizationProfileQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as webhooksWebhookDeliveryValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_delivery_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { toTaxonomyRecord } from "../data/records.js";
import { ContentRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate taxonomy operations and persist audit data.
 */
@injectable()
export class TaxonomyValidationWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.content.v1.ArticleValidationService") private readonly contentArticleValidationClient: contentArticleValidationServiceApi.ArticleValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockValidationService") private readonly contentContentBlockValidationClient: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionValidationService") private readonly contentContentRevisionValidationClient: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyCalculationService") private readonly contentTaxonomyCalculationClient: contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormQueryService") private readonly formsFormQueryClient: formsFormQueryServiceApi.FormQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetService") private readonly mediaMediaAssetClient: mediaMediaAssetServiceApi.MediaAssetServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileQueryService") private readonly personalizationProfileQueryClient: personalizationProfileQueryServiceApi.ProfileQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookDeliveryValidationService") private readonly webhooksWebhookDeliveryValidationClient: webhooksWebhookDeliveryValidationServiceApi.WebhookDeliveryValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a taxonomy.
   */
  async checkTaxonomyEligibility(req: contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest): Promise<contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "CheckTaxonomyEligibility", req);
    this.logger.info("check_taxonomy_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormQueryServiceApi.SuggestFormsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.taxonomy?.location?.region ?? "") },
    });
    const invoke1: Unary<formsFormQueryServiceApi.SuggestFormsRequest, formsFormQueryServiceApi.SuggestFormsResponse> =
      (input, done) => this.formsFormQueryClient.suggestForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormQueryServiceApi.SuggestFormsRequest, formsFormQueryServiceApi.SuggestFormsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse.fromPartial({
        taxonomy: {
          status: req?.taxonomy?.status,
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a taxonomy.
   */
  async explainTaxonomyDecision(req: contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionRequest): Promise<contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "ExplainTaxonomyDecision", req);
    this.logger.info("explain_taxonomy_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest, contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse> =
      (input, done) => this.contentContentRevisionValidationClient.normalizeContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest, contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = contentArticleValidationServiceApi.ScoreArticleRequest.fromPartial({
      article: {
        audit: { updatedAt: input2?.taxonomy?.audit?.updatedAt },
        billingAddress: { countryCode: (input2?.taxonomy?.location?.countryCode ?? "") },
      },
      context: input2?.context,
      details: {
        destination: { locality: (input2?.taxonomy?.location?.locality ?? "") },
      },
    });
    const invoke2: Unary<contentArticleValidationServiceApi.ScoreArticleRequest, contentArticleValidationServiceApi.ScoreArticleResponse> =
      (input, done) => this.contentArticleValidationClient.scoreArticle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentArticleValidationServiceApi.ScoreArticleRequest, contentArticleValidationServiceApi.ScoreArticleResponse>(invoke2, request2);
    const request3 = contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            audit: {
              createdBy: (req?.taxonomy?.audit?.createdBy ?? ""),
              updatedBy: (req?.taxonomy?.audit?.updatedBy ?? ""),
            },
            location: {
              locality: (req?.taxonomy?.location?.locality ?? ""),
              region: (req?.taxonomy?.location?.region ?? ""),
            },
          }],
        }],
      },
    });
    const cloned3: contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest, contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse> =
      (input, done) => this.contentTaxonomyCalculationClient.explainTaxonomyCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest, contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse>(invoke3, cloned3);
    const request4 = contentContentBlockValidationServiceApi.NormalizeContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { createdBy: (req?.taxonomy?.audit?.createdBy ?? "") },
            location: { countryCode: (reply2?.article?.billingAddress?.countryCode ?? "") },
            manager: { userId: (reply3?.taxonomy?.manager?.userId ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const decoded4 = contentContentBlockValidationServiceApi.NormalizeContentBlockRequest.fromJSON(
      JSON.parse(JSON.stringify(contentContentBlockValidationServiceApi.NormalizeContentBlockRequest.toJSON(request4))),
    );
    const invoke4: Unary<contentContentBlockValidationServiceApi.NormalizeContentBlockRequest, contentContentBlockValidationServiceApi.NormalizeContentBlockResponse> =
      (input, done) => this.contentContentBlockValidationClient.normalizeContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<contentContentBlockValidationServiceApi.NormalizeContentBlockRequest, contentContentBlockValidationServiceApi.NormalizeContentBlockResponse>(invoke4, decoded4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        taxonomy: { attributes: (reply1?.contentRevision?.attributes ?? {}) },
      }),
      contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{ audit: { updatedAt: reply2?.article?.audit?.updatedAt } }],
          }],
        },
      }),
      contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionResponse.fromPartial({
        taxonomy: { children: [{ children: [{ location: reply3?.taxonomy?.location }] }] },
      }),
      contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{ audit: { createdBy: (reply4?.contentBlock?.audit?.createdBy ?? "") } }],
          }],
        },
      }),
      contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionResponse.fromPartial({
        taxonomy: {
          depth: (req?.taxonomy?.depth ?? 0),
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a taxonomy.
   */
  async getTaxonomyRules(req: contentTaxonomyValidationServiceApi.GetTaxonomyRulesRequest): Promise<contentTaxonomyValidationServiceApi.GetTaxonomyRulesResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTaxonomyRules", req);
    this.logger.info("get_taxonomy_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    return contentTaxonomyValidationServiceApi.GetTaxonomyRulesResponse.fromPartial({ taxonomy: { taxonomyId: (req?.taxonomyId ?? "") } });
  }

  /**
   * Lints a taxonomy.
   */
  async lintTaxonomies(req: contentTaxonomyValidationServiceApi.LintTaxonomiesRequest): Promise<contentTaxonomyValidationServiceApi.LintTaxonomiesResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "LintTaxonomies", req);
    this.logger.info("lint_taxonomies", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.taxonomy?.location?.region ?? "") },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.surveys.v1.FindSurveyResponsesRequest",
      value: Buffer.from(surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest.encode(request1).finish()),
    });
    const unpacked1 = surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest.decode(envelope1.value);
    const invoke1: Unary<surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.FindSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.findSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.FindSurveyResponsesResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyValidationServiceApi.LintTaxonomiesResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      contentTaxonomyValidationServiceApi.LintTaxonomiesResponse.fromPartial({
        taxonomy: {
          parentId: (req?.taxonomy?.parentId ?? ""),
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a taxonomy.
   */
  async previewTaxonomy(req: contentTaxonomyValidationServiceApi.PreviewTaxonomyRequest): Promise<contentTaxonomyValidationServiceApi.PreviewTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "PreviewTaxonomy", req);
    this.logger.info("preview_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileQueryServiceApi.ResolveProfilesRequest.fromPartial({ context: req?.context });
    const client1 = this.clients.get<personalizationProfileQueryServiceApi.ProfileQueryServiceClient>("acme.personalization.v1.ProfileQueryService");
    const invoke1: Unary<personalizationProfileQueryServiceApi.ResolveProfilesRequest, personalizationProfileQueryServiceApi.ResolveProfilesResponse> =
      (input, done) => client1.resolveProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileQueryServiceApi.ResolveProfilesRequest, personalizationProfileQueryServiceApi.ResolveProfilesResponse>(invoke1, request1);
    const request2 = webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
      webhookDelivery: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (req?.taxonomy?.manager?.displayName ?? "") },
      },
    });
    const invoke2: Unary<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest, webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse> =
      (input, done) => this.webhooksWebhookDeliveryValidationClient.checkWebhookDeliveryEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityRequest, webhooksWebhookDeliveryValidationServiceApi.CheckWebhookDeliveryEligibilityResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest.fromPartial({ context: req?.context });
    const invoke3: Unary<mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest, mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetClient.batchGetMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest, mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyValidationServiceApi.PreviewTaxonomyResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      contentTaxonomyValidationServiceApi.PreviewTaxonomyResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      contentTaxonomyValidationServiceApi.PreviewTaxonomyResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      contentTaxonomyValidationServiceApi.PreviewTaxonomyResponse.fromPartial({
        taxonomy: {
          parentId: (req?.taxonomy?.parentId ?? ""),
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a taxonomy.
   */
  async scoreTaxonomy(req: contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest): Promise<contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "ScoreTaxonomy", req);
    this.logger.info("score_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.CloneUserRequest.fromPartial({
      context: req?.context,
      user: {
        primaryAddress: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
    });
    const invoke1: Unary<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse> =
      (input, done) => this.identityUserClient.cloneUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ScoreTaxonomy.CloneUser", () => call<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{ audit: { createdAt: reply1?.user?.audit?.createdAt } }],
            location: { postalCode: (reply1?.user?.primaryAddress?.postalCode ?? "") },
          }],
        },
      }),
      contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        taxonomy: { taxonomyId: (req?.taxonomyId ?? "") },
      }),
    );
  }

  /**
   * Validates a taxonomy.
   */
  async validateTaxonomy(req: contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest): Promise<contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "ValidateTaxonomy", req);
    this.logger.info("validate_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{ manager: { email: (req?.taxonomy?.manager?.email ?? "") } }],
        }],
      },
    });
    const invoke1: Unary<contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsRequest, contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse> =
      (input, done) => this.contentTaxonomyCalculationClient.compareTaxonomyOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.taxonomy?.attributes ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const reply2 = await this.workQueue.enqueue<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse>(
      "acme.content.v1.TaxonomyValidationService/ValidateTaxonomy:1", request2,
    );
    const request3 = contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          children: [{
            location: { countryCode: (req?.taxonomy?.location?.countryCode ?? "") },
          }],
        }],
      },
    });
    const invoke3: Unary<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest, contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse> =
      (input, done) => this.contentTaxonomyCalculationClient.explainTaxonomyCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await inRequest(req.context!, () => call<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest, contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.details?.contact?.preferredChannel ?? "") });
    return mergeResponses(
      contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{
              children: [{ depth: (reply1?.taxonomy?.depth ?? 0) }],
              location: { recipient: (reply1?.taxonomy?.location?.recipient ?? "") },
            }],
          }],
        },
      }),
      contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{ depth: (reply3?.taxonomy?.depth ?? 0) }],
            manager: { displayName: (reply3?.taxonomy?.manager?.displayName ?? "") },
          }],
        },
      }),
      contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse.fromPartial({
        taxonomy: {
          status: req?.taxonomy?.status,
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for TaxonomyValidationService; workflows own validation and database transactions.
 */
@injectable()
export class TaxonomyValidationHandler {
  constructor(@inject(TaxonomyValidationWorkflow) private readonly workflow: TaxonomyValidationWorkflow) {}

  /**
   * Checks a taxonomy.
   */
  checkTaxonomyEligibility = unary<contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest, contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse>(
    (request) => this.workflow.checkTaxonomyEligibility(request),
  );

  /**
   * Explains a taxonomy.
   */
  explainTaxonomyDecision = unary<contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionRequest, contentTaxonomyValidationServiceApi.ExplainTaxonomyDecisionResponse>(
    (request) => this.workflow.explainTaxonomyDecision(request),
  );

  /**
   * Returns a taxonomy.
   */
  getTaxonomyRules = (call: ServerUnaryCall<contentTaxonomyValidationServiceApi.GetTaxonomyRulesRequest, contentTaxonomyValidationServiceApi.GetTaxonomyRulesResponse>, done: sendUnaryData<contentTaxonomyValidationServiceApi.GetTaxonomyRulesResponse>): void => {
    void this.workflow.getTaxonomyRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a taxonomy.
   */
  lintTaxonomies = unary<contentTaxonomyValidationServiceApi.LintTaxonomiesRequest, contentTaxonomyValidationServiceApi.LintTaxonomiesResponse>(
    (request) => this.workflow.lintTaxonomies(request),
  );

  /**
   * Previews a taxonomy.
   */
  previewTaxonomy = unary<contentTaxonomyValidationServiceApi.PreviewTaxonomyRequest, contentTaxonomyValidationServiceApi.PreviewTaxonomyResponse>(
    (request) => this.workflow.previewTaxonomy(request),
  );

  /**
   * Scores a taxonomy.
   */
  scoreTaxonomy = (call: ServerUnaryCall<contentTaxonomyValidationServiceApi.ScoreTaxonomyRequest, contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse>, done: sendUnaryData<contentTaxonomyValidationServiceApi.ScoreTaxonomyResponse>): void => {
    void this.workflow.scoreTaxonomy(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a taxonomy.
   */
  validateTaxonomy = unary<contentTaxonomyValidationServiceApi.ValidateTaxonomyRequest, contentTaxonomyValidationServiceApi.ValidateTaxonomyResponse>(
    (request) => this.workflow.validateTaxonomy(request),
  );
}

export function implementation(handler: TaxonomyValidationHandler): contentTaxonomyValidationServiceApi.TaxonomyValidationServiceServer {
  return {
    checkTaxonomyEligibility: handler.checkTaxonomyEligibility,
    explainTaxonomyDecision: handler.explainTaxonomyDecision,
    getTaxonomyRules: handler.getTaxonomyRules,
    lintTaxonomies: handler.lintTaxonomies,
    previewTaxonomy: handler.previewTaxonomy,
    scoreTaxonomy: handler.scoreTaxonomy,
    validateTaxonomy: handler.validateTaxonomy,
  };
}
