/**
 * Computes the figures of a form submission, such as totals, taxes, and estimates. Remote work stays behind typed
 * client ports.
 */

import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as formsFormCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormSubmissionCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as telehealthVideoVisitServiceApi from "../../../../.cache/proto/acme/telehealth/v1/video_visit_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toFormSubmissionRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form submission operations and persist audit data.
 */
@injectable()
export class FormSubmissionCalculationWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("grpc:acme.telehealth.v1.VideoVisitService") private readonly telehealthVideoVisitClient: telehealthVideoVisitServiceApi.VideoVisitServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookSecretValidationService") private readonly webhooksWebhookSecretValidationClient: webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a form submission.
   */
  async calculateFormSubmission(req: formsFormSubmissionCalculationServiceApi.CalculateFormSubmissionRequest): Promise<formsFormSubmissionCalculationServiceApi.CalculateFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "CalculateFormSubmission", req);
    this.logger.info("calculate_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.formSubmission?.measurements ?? []).map(async (item) => {
      const request1 = telehealthVideoVisitServiceApi.CloneVideoVisitRequest.fromPartial({
        context: req?.context,
        videoVisit: {
          audit: { createdAt: item?.observedAt },
          location: {
            locality: (req?.details?.destination?.locality ?? ""),
            recipient: (req?.details?.destination?.recipient ?? ""),
          },
          organizer: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
        },
      });
      const invoke1: Unary<telehealthVideoVisitServiceApi.CloneVideoVisitRequest, telehealthVideoVisitServiceApi.CloneVideoVisitResponse> =
        (input, done) => this.telehealthVideoVisitClient.cloneVideoVisit(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<telehealthVideoVisitServiceApi.CloneVideoVisitRequest, telehealthVideoVisitServiceApi.CloneVideoVisitResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? telehealthVideoVisitServiceApi.CloneVideoVisitResponse.fromPartial({});
    const request2 = webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest.fromPartial({
      context: req?.context,
      webhookSecret: { contact: { email: (reply1?.videoVisit?.organizer?.email ?? "") } },
    });
    const method2 = "checkWebhookSecretEligibility" as const;
    const invoke2: Unary<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse> =
      (input, done) => this.webhooksWebhookSecretValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityRequest, webhooksWebhookSecretValidationServiceApi.CheckWebhookSecretEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionCalculationServiceApi.CalculateFormSubmissionResponse.fromPartial({
        breakdown: { currencyCode: (reply2?.webhookSecret?.currencyCode ?? "") },
        formSubmission: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      formsFormSubmissionCalculationServiceApi.CalculateFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          subject: req?.formSubmission?.subject,
        },
      }),
    );
  }

  /**
   * Compares a form submission.
   */
  async compareFormSubmissionOptions(req: formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsRequest): Promise<formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "CompareFormSubmissionOptions", req);
    this.logger.info("compare_form_submission_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.RecalculateFormsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
      form: {
        billingAddress: {
          locality: (req?.details?.destination?.locality ?? ""),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
        },
        counterparty: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const proxy1 = forwarding(this.formsFormCalculationClient);
    const invoke1: Unary<formsFormCalculationServiceApi.RecalculateFormsRequest, formsFormCalculationServiceApi.RecalculateFormsResponse> =
      (input, done) => proxy1.recalculateForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormCalculationServiceApi.RecalculateFormsRequest, formsFormCalculationServiceApi.RecalculateFormsResponse>(invoke1, request1);
    const request2 = notificationsNotificationServiceApi.CloneNotificationRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
        audit: { etag: (reply1?.form?.audit?.etag ?? "") },
        origin: { $case: "customer", customer: { displayName: (reply1?.form?.counterparty?.displayName ?? "") } },
      },
    });
    const invoke2: Unary<notificationsNotificationServiceApi.CloneNotificationRequest, notificationsNotificationServiceApi.CloneNotificationResponse> =
      (input, done) => this.notificationsNotificationClient.cloneNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsNotificationServiceApi.CloneNotificationRequest, notificationsNotificationServiceApi.CloneNotificationResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsResponse.fromPartial({
        formSubmission: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      formsFormSubmissionCalculationServiceApi.CompareFormSubmissionOptionsResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          kind: (req?.formSubmission?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a form submission.
   */
  async estimateFormSubmission(req: formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest): Promise<formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "EstimateFormSubmission", req);
    this.logger.info("estimate_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.countSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<surveysSurveyResponseQueryServiceApi.CountSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.CountSurveyResponsesResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = formsFormCalculationServiceApi.QuoteFormRequest.fromPartial({
      context: input2?.context,
      details: {
        destination: {
          lines: (input2?.details?.destination?.lines ?? []).map((value) => value),
          locality: (input2?.details?.destination?.locality ?? ""),
          postalCode: (input2?.details?.destination?.postalCode ?? ""),
        },
      },
    });
    const invoke2: Unary<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse> =
      (input, done) => this.formsFormCalculationClient.quoteForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse.fromPartial({
        breakdown: { currencyCode: (reply2?.breakdown?.currencyCode ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          kind: (req?.formSubmission?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a form submission.
   */
  async explainFormSubmissionCalculation(req: formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationRequest): Promise<formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "ExplainFormSubmissionCalculation", req);
    this.logger.info("explain_form_submission_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.CheckForumEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
      forum: {
        children: [{
          children: [{
            children: [{
              attributes: Object.fromEntries(Object.entries((req?.formSubmission?.attributes ?? {}))),
            }],
            manager: {
              displayName: (req?.formSubmission?.subject?.displayName ?? ""),
              email: (req?.details?.contact?.email ?? ""),
            },
          }],
        }],
      },
    });
    const cloned1: communityForumValidationServiceApi.CheckForumEligibilityRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse> =
      (input, done) => this.communityForumValidationClient.checkForumEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumValidationServiceApi.CheckForumEligibilityRequest, communityForumValidationServiceApi.CheckForumEligibilityResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationResponse.fromPartial({
        formSubmission: {
          correlationId: (req?.formSubmission?.correlationId ?? ""),
          formSubmissionId: (req?.formSubmissionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a form submission.
   */
  async getFormSubmissionRates(req: formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesRequest): Promise<formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormSubmissionRates", req);
    this.logger.info("get_form_submission_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.QuoteFormRequest.fromPartial({
      context: req?.context,
      form: {
        audit: { createdAt: req?.context?.deadline },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        }],
      },
    });
    const decoded1 = formsFormCalculationServiceApi.QuoteFormRequest.fromJSON(
      JSON.parse(JSON.stringify(formsFormCalculationServiceApi.QuoteFormRequest.toJSON(request1))),
    );
    const invoke1: Unary<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse> =
      (input, done) => this.formsFormCalculationClient.quoteForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse>(invoke1, decoded1);
    return mergeResponses(
      formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesResponse.fromPartial({ formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") } }),
    );
  }

  /**
   * Quotes a form submission.
   */
  async quoteFormSubmission(req: formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest): Promise<formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "QuoteFormSubmission", req);
    this.logger.info("quote_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.EstimateProfileRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { postalCode: (req?.details?.destination?.postalCode ?? "") },
      },
      profile: {
        primaryAddress: { locality: (req?.details?.destination?.locality ?? "") },
        relationshipManager: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.EstimateProfileRequest",
      value: Buffer.from(personalizationProfileCalculationServiceApi.EstimateProfileRequest.encode(request1).finish()),
    });
    const unpacked1 = personalizationProfileCalculationServiceApi.EstimateProfileRequest.decode(envelope1.value);
    const invoke1: Unary<personalizationProfileCalculationServiceApi.EstimateProfileRequest, personalizationProfileCalculationServiceApi.EstimateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.estimateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.EstimateProfileRequest, personalizationProfileCalculationServiceApi.EstimateProfileResponse>(invoke1, unpacked1);
    const request2 = formsFormCalculationServiceApi.CompareFormOptionsRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (reply1?.profile?.primaryAddress?.locality ?? "") },
      },
      form: {
        billingAddress: {
          recipient: (reply1?.profile?.primaryAddress?.recipient ?? ""),
          region: (req?.details?.destination?.region ?? ""),
        },
      },
    });
    const client2 = this.clients.get<formsFormCalculationServiceApi.FormCalculationServiceClient>("acme.forms.v1.FormCalculationService");
    const invoke2: Unary<formsFormCalculationServiceApi.CompareFormOptionsRequest, formsFormCalculationServiceApi.CompareFormOptionsResponse> =
      (input, done) => client2.compareFormOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormCalculationServiceApi.CompareFormOptionsRequest, formsFormCalculationServiceApi.CompareFormOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse.fromPartial({
        breakdown: { total: reply2?.form?.total },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          sequence: (req?.formSubmission?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Recalculates a form submission.
   */
  async recalculateFormSubmissions(req: formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsRequest): Promise<formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "RecalculateFormSubmissions", req);
    this.logger.info("recalculate_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.QuoteFormRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (req?.details?.destination?.countryCode ?? "") },
      },
      form: {
        counterparty: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse> =
      (input, done) => this.formsFormCalculationClient.quoteForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<formsFormCalculationServiceApi.QuoteFormRequest, formsFormCalculationServiceApi.QuoteFormResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      formsFormSubmissionCalculationServiceApi.RecalculateFormSubmissionsResponse.fromPartial({
        formSubmission: {
          attributes: (req?.formSubmission?.attributes ?? {}),
          formSubmissionId: (req?.formSubmissionId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a form submission.
   */
  async simulateFormSubmission(req: formsFormSubmissionCalculationServiceApi.SimulateFormSubmissionRequest): Promise<formsFormSubmissionCalculationServiceApi.SimulateFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "SimulateFormSubmission", req);
    this.logger.info("simulate_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.ExplainFormCalculationRequest.fromPartial({
      context: req?.context,
      form: {
        billingAddress: {
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          locality: (req?.details?.destination?.locality ?? ""),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse> =
      (input, done) => this.formsFormCalculationClient.explainFormCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionCalculationServiceApi.SimulateFormSubmissionResponse.fromPartial({ result: { status: (reply1?.outcome?.status ?? "") } }),
      formsFormSubmissionCalculationServiceApi.SimulateFormSubmissionResponse.fromPartial({
        formSubmission: {
          attributes: (req?.formSubmission?.attributes ?? {}),
          formSubmissionId: (req?.formSubmissionId ?? ""),
        },
      }),
    );
  }
}
