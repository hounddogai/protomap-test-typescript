/**
 * Checks forms against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityPostCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as formsFormCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormSubmissionCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as formsFormValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as showsShowCalculationServiceApi from "../../../../../.cache/proto/acme/shows/v1/show_calculation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
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
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toFormRecord } from "../../data/records.js";
import { FormsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form operations and persist audit data.
 */
@injectable()
export class FormValidationWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureCalculationService") private readonly experimentsExposureCalculationClient: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionCalculationService") private readonly formsFormSubmissionCalculationClient: formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.shows.v1.ShowCalculationService") private readonly showsShowCalculationClient: showsShowCalculationServiceApi.ShowCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a form.
   */
  async checkFormEligibility(req: formsFormValidationServiceApi.CheckFormEligibilityRequest): Promise<formsFormValidationServiceApi.CheckFormEligibilityResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "CheckFormEligibility", req);
    this.logger.info("check_form_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.EstimateFormRequest.fromPartial({
      context: req?.context,
      form: {
        counterparty: { customerId: (req?.form?.counterparty?.customerId ?? "") },
      },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse> =
      (input, done) => this.formsFormCalculationClient.estimateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityPostValidationServiceApi.ValidatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { updatedAt: reply1?.form?.audit?.updatedAt },
        settlement: { $case: "bank", bank: {
          accountHolder: ((req?.form?.settlement?.$case === "bank" ? req?.form?.settlement.bank : undefined)?.accountHolder ?? ""),
        } },
        billingAddress: { locality: (req?.form?.billingAddress?.locality ?? "") },
      },
    });
    const invoke2: Unary<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse> =
      (input, done) => this.communityPostValidationClient.validatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormValidationServiceApi.CheckFormEligibilityResponse.fromPartial({
        form: {
          billingAddress: { lines: (reply1?.form?.billingAddress?.lines ?? []) },
        },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      formsFormValidationServiceApi.CheckFormEligibilityResponse.fromPartial({
        form: { metadata: (reply2?.post?.metadata ?? {}) },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      formsFormValidationServiceApi.CheckFormEligibilityResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          issuedAt: req?.form?.issuedAt,
        },
      }),
    );
  }

  /**
   * Explains a form.
   */
  async explainFormDecision(req: formsFormValidationServiceApi.ExplainFormDecisionRequest): Promise<formsFormValidationServiceApi.ExplainFormDecisionResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "ExplainFormDecision", req);
    this.logger.info("explain_form_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = showsShowCalculationServiceApi.CalculateShowRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (req?.form?.billingAddress?.countryCode ?? "") },
      },
      show: {
        audit: { updatedBy: (req?.form?.audit?.updatedBy ?? "") },
        location: { region: (req?.form?.billingAddress?.region ?? "") },
      },
    });
    const invoke1: Unary<showsShowCalculationServiceApi.CalculateShowRequest, showsShowCalculationServiceApi.CalculateShowResponse> =
      (input, done) => this.showsShowCalculationClient.calculateShow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ExplainFormDecision.CalculateShow", () => call<showsShowCalculationServiceApi.CalculateShowRequest, showsShowCalculationServiceApi.CalculateShowResponse>(invoke1, request1));
    const request2 = experimentsExposureCalculationServiceApi.CalculateExposureRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (req?.form?.billingAddress?.locality ?? ""),
          region: (req?.form?.billingAddress?.region ?? ""),
        },
      },
      exposure: {
        subject: { displayName: (reply1?.show?.organizer?.displayName ?? "") },
      },
    });
    const invoke2: Unary<experimentsExposureCalculationServiceApi.CalculateExposureRequest, experimentsExposureCalculationServiceApi.CalculateExposureResponse> =
      (input, done) => this.experimentsExposureCalculationClient.calculateExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = formsFormCalculationServiceApi.GetFormRatesRequest.fromPartial({
      context: req?.context,
      formId: (req?.formId ?? ""),
    });
    const reply3 = await this.workQueue.enqueue<formsFormCalculationServiceApi.GetFormRatesRequest, formsFormCalculationServiceApi.GetFormRatesResponse>(
      "acme.forms.v1.FormValidationService/ExplainFormDecision:2", request3,
    );
    const request4 = featureflagsFeatureFlagServiceApi.ListFeatureFlagsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply2?.exposure?.subject?.startsAt,
        region: (req?.form?.billingAddress?.region ?? ""),
      },
    });
    const invoke4: Unary<featureflagsFeatureFlagServiceApi.ListFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.ListFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.listFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await inRequest(req.context!, () => call<featureflagsFeatureFlagServiceApi.ListFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.ListFeatureFlagsResponse>(invoke4, request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormValidationServiceApi.ExplainFormDecisionResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      formsFormValidationServiceApi.ExplainFormDecisionResponse.fromPartial({
        form: { lines: [{ attributes: (reply2?.exposure?.attributes ?? {}) }] },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      formsFormValidationServiceApi.ExplainFormDecisionResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      formsFormValidationServiceApi.ExplainFormDecisionResponse.fromPartial({
        outcome: { status: (reply4?.result?.status ?? "") },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      formsFormValidationServiceApi.ExplainFormDecisionResponse.fromPartial({
        form: {
          counterparty: req?.form?.counterparty,
          formId: (req?.formId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a form.
   */
  async getFormRules(req: formsFormValidationServiceApi.GetFormRulesRequest): Promise<formsFormValidationServiceApi.GetFormRulesResponse> {
    validateContext(req.context);
    if (!req.formId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormRules", req);
    this.logger.info("get_form_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.CalculateFormRequest.fromPartial({
      context: req?.context,
      form: {
        audit: { createdAt: req?.context?.deadline },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
      },
      formId: (req?.formId ?? ""),
    });
    const invoke1: Unary<formsFormCalculationServiceApi.CalculateFormRequest, formsFormCalculationServiceApi.CalculateFormResponse> =
      (input, done) => this.formsFormCalculationClient.calculateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<formsFormCalculationServiceApi.CalculateFormResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      formsFormValidationServiceApi.GetFormRulesResponse.fromPartial({
        form: {
          audit: { createdBy: (reply1?.form?.audit?.createdBy ?? "") },
          counterparty: { displayName: (reply1?.form?.counterparty?.displayName ?? "") },
        },
      }),
      formsFormValidationServiceApi.GetFormRulesResponse.fromPartial({ form: { formId: (req?.formId ?? "") } }),
    );
  }

  /**
   * Lints a form.
   */
  async lintForms(req: formsFormValidationServiceApi.LintFormsRequest): Promise<formsFormValidationServiceApi.LintFormsResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "LintForms", req);
    this.logger.info("lint_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: {
          locality: (req?.form?.billingAddress?.locality ?? ""),
          postalCode: (req?.form?.billingAddress?.postalCode ?? ""),
        },
        settlement: { $case: "card", card: {
          holderName: ((req?.form?.settlement?.$case === "card" ? req?.form?.settlement.card : undefined)?.holderName ?? ""),
        } },
      },
    });
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.compareRecommendationOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    let selected2_3: string | undefined;
    switch (req?.form?.settlement?.$case) {
      case "card":
        selected2_3 = ((req?.form?.settlement?.$case === "card" ? req?.form?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = formsFormCalculationServiceApi.EstimateFormRequest.fromPartial({
      context: req?.context,
      form: {
        billingAddress: {
          postalCode: (req?.form?.billingAddress?.postalCode ?? ""),
          region: (req?.form?.billingAddress?.region ?? ""),
        },
        settlement: { $case: "card", card: { holderName: (selected2_3 ?? "") } },
      },
    });
    const invoke2: Unary<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse> =
      (input, done) => this.formsFormCalculationClient.estimateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse>(invoke2, request2);
    const request3 = formsFormCalculationServiceApi.RecalculateFormsRequest.fromPartial({
      context: req?.context,
      form: {
        settlement: { $case: "bank", bank: {
          accountHolder: ((req?.form?.settlement?.$case === "bank" ? req?.form?.settlement.bank : undefined)?.accountHolder ?? ""),
        } },
      },
    });
    const method3 = "recalculateForms" as const;
    const invoke3: Unary<formsFormCalculationServiceApi.RecalculateFormsRequest, formsFormCalculationServiceApi.RecalculateFormsResponse> =
      (input, done) => this.formsFormCalculationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormCalculationServiceApi.RecalculateFormsRequest, formsFormCalculationServiceApi.RecalculateFormsResponse>(invoke3, request3);
    const results4 = await Promise.all((req?.form?.lines ?? []).map(async (item) => {
      const request4 = formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest.fromPartial({
        context: req?.context,
        details: {
          destination: {
            countryCode: (reply1?.recommendation?.billingAddress?.countryCode ?? ""),
            region: (reply1?.recommendation?.billingAddress?.region ?? ""),
          },
        },
        formSubmission: {
          attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
        },
      });
      const invoke4: Unary<formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse> =
        (input, done) => this.formsFormSubmissionCalculationClient.estimateFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply4 = await call<formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse>(invoke4, request4);
      return reply4;
    }));
    const reply4 = results4.at(-1) ?? formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormValidationServiceApi.LintFormsResponse.fromPartial({
        form: {
          billingAddress: { region: (reply1?.recommendation?.billingAddress?.region ?? "") },
        },
      }),
      formsFormValidationServiceApi.LintFormsResponse.fromPartial({
        form: { counterparty: { email: (reply2?.form?.counterparty?.email ?? "") } },
      }),
      formsFormValidationServiceApi.LintFormsResponse.fromPartial({
        form: {
          counterparty: { customerId: (reply3?.form?.counterparty?.customerId ?? "") },
        },
      }),
      formsFormValidationServiceApi.LintFormsResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          issuedAt: req?.form?.issuedAt,
        },
      }),
    );
  }

  /**
   * Normalizes a form.
   */
  async normalizeForm(req: formsFormValidationServiceApi.NormalizeFormRequest): Promise<formsFormValidationServiceApi.NormalizeFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "NormalizeForm", req);
    this.logger.info("normalize_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.form?.lines ?? []).map(async (item) => {
      const request1 = authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.fromPartial({
        context: req?.context,
        filter: {
          labels: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          ownerId: (item?.lineId ?? ""),
          region: (req?.form?.billingAddress?.region ?? ""),
        },
      });
      const invoke1: Unary<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse> =
        (input, done) => this.authorizationAccessPolicyQueryClient.countAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse.fromPartial({});
    const request2 = formsFormCalculationServiceApi.ExplainFormCalculationRequest.fromPartial({
      context: req?.context,
      form: {
        billingAddress: {
          lines: (req?.form?.billingAddress?.lines ?? []).map((value) => value),
          recipient: (req?.form?.billingAddress?.recipient ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.formsFormCalculationClient);
    const invoke2: Unary<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse> =
      (input, done) => proxy2.explainFormCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormValidationServiceApi.NormalizeFormResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      formsFormValidationServiceApi.NormalizeFormResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          metadata: (req?.form?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Previews a form.
   */
  async previewForm(req: formsFormValidationServiceApi.PreviewFormRequest): Promise<formsFormValidationServiceApi.PreviewFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "PreviewForm", req);
    this.logger.info("preview_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest.fromPartial({
      context: req?.context,
      featureFlag: {
        audit: {
          createdAt: req?.form?.audit?.createdAt,
          updatedBy: (req?.form?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke1: Unary<featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CreateFeatureFlagResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.createFeatureFlag(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<featureflagsFeatureFlagServiceApi.CreateFeatureFlagRequest, featureflagsFeatureFlagServiceApi.CreateFeatureFlagResponse>(invoke1, request1);
    const request2 = notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.validateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ValidateDeliveryAttemptResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormValidationServiceApi.PreviewFormResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormValidationServiceApi.PreviewFormResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      formsFormValidationServiceApi.PreviewFormResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          status: req?.form?.status,
        },
      }),
    );
  }

  /**
   * Scores a form.
   */
  async scoreForm(req: formsFormValidationServiceApi.ScoreFormRequest): Promise<formsFormValidationServiceApi.ScoreFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "ScoreForm", req);
    this.logger.info("score_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const tasks1: Array<() => Promise<experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse>> = [];
    for (const item of (req?.form?.lines ?? [])) {
      tasks1.push(async () => {
        const request1 = experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest.fromPartial({
          context: req?.context,
          details: {
            destination: { recipient: (req?.details?.destination?.recipient ?? "") },
          },
          exposure: {
            attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          },
        });
        const invoke1: Unary<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse> =
          (input, done) => this.experimentsExposureCalculationClient.compareExposureOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply1 = await call<experimentsExposureCalculationServiceApi.CompareExposureOptionsRequest, experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse>(invoke1, request1);
        return reply1;
      });
    }
    const results1 = await Promise.all(tasks1.map((task) => task()));
    const reply1 = results1.at(-1) ?? experimentsExposureCalculationServiceApi.CompareExposureOptionsResponse.fromPartial({});
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = formsFormCalculationServiceApi.QuoteFormRequest.fromPartial({
      context: input2?.context,
      form: {
        audit: { updatedBy: (input2?.form?.audit?.updatedBy ?? "") },
        settlement: { $case: "card", card: {
          holderName: ((input2?.form?.settlement?.$case === "card" ? input2?.form?.settlement.card : undefined)?.holderName ?? ""),
        } },
        counterparty: { customerId: (input2?.form?.counterparty?.customerId ?? "") },
      },
    });
    const invoke2: Unary<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse> =
      (input, done) => this.formsFormCalculationClient.quoteForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse>(invoke2, request2);
    const request3 = formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (reply2?.form?.billingAddress?.countryCode ?? ""),
          locality: (reply2?.form?.billingAddress?.locality ?? ""),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
          region: (reply2?.form?.billingAddress?.region ?? ""),
        },
      },
    });
    const cloned3: formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionCalculationClient.quoteFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormValidationServiceApi.ScoreFormResponse.fromPartial({
        form: { total: reply2?.form?.total },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      formsFormValidationServiceApi.ScoreFormResponse.fromPartial({ breakdown: { currencyCode: (reply3?.breakdown?.currencyCode ?? "") } }),
      formsFormValidationServiceApi.ScoreFormResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          number: (req?.form?.number ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a form.
   */
  async validateForm(req: formsFormValidationServiceApi.ValidateFormRequest): Promise<formsFormValidationServiceApi.ValidateFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "ValidateForm", req);
    this.logger.info("validate_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { etag: (req?.form?.audit?.etag ?? "") },
        billingAddress: { region: (req?.form?.billingAddress?.region ?? "") },
        settlement: { $case: "card", card: {
          network: ((req?.form?.settlement?.$case === "card" ? req?.form?.settlement.card : undefined)?.network ?? ""),
        } },
      },
    });
    const decoded1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromJSON(
      JSON.parse(JSON.stringify(communityPostCalculationServiceApi.ComparePostOptionsRequest.toJSON(request1))),
    );
    const invoke1: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient.comparePostOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke1, decoded1);
    const request2 = formsFormCalculationServiceApi.GetFormRatesRequest.fromPartial({
      context: req?.context,
      formId: (req?.formId ?? ""),
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.GetFormRatesRequest",
      value: Buffer.from(formsFormCalculationServiceApi.GetFormRatesRequest.encode(request2).finish()),
    });
    const unpacked2 = formsFormCalculationServiceApi.GetFormRatesRequest.decode(envelope2.value);
    const invoke2: Unary<formsFormCalculationServiceApi.GetFormRatesRequest, formsFormCalculationServiceApi.GetFormRatesResponse> =
      (input, done) => this.formsFormCalculationClient.getFormRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormCalculationServiceApi.GetFormRatesRequest, formsFormCalculationServiceApi.GetFormRatesResponse>(invoke2, unpacked2);
    let selected3_1: string | undefined;
    switch (req?.form?.settlement?.$case) {
      case "card":
        selected3_1 = ((req?.form?.settlement?.$case === "card" ? req?.form?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected3_1 = "";
    }
    const request3 = formsFormCalculationServiceApi.EstimateFormRequest.fromPartial({
      context: req?.context,
      form: {
        settlement: { $case: "card", card: { holderName: (selected3_1 ?? "") } },
      },
    });
    const invoke3: Unary<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse> =
      (input, done) => this.formsFormCalculationClient.estimateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormValidationServiceApi.ValidateFormResponse.fromPartial({
        form: { audit: { createdBy: (reply1?.post?.audit?.createdBy ?? "") } },
      }),
      formsFormValidationServiceApi.ValidateFormResponse.fromPartial({
        form: {
          audit: { createdBy: (reply2?.form?.audit?.createdBy ?? "") },
          billingAddress: { countryCode: (reply2?.form?.billingAddress?.countryCode ?? "") },
        },
      }),
      formsFormValidationServiceApi.ValidateFormResponse.fromPartial({
        form: {
          counterparty: { displayName: (reply3?.form?.counterparty?.displayName ?? "") },
          metadata: (reply3?.form?.metadata ?? {}),
        },
      }),
      formsFormValidationServiceApi.ValidateFormResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          issuedAt: req?.form?.issuedAt,
        },
      }),
    );
  }
}
