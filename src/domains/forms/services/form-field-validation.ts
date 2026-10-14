/**
 * Checks form fields against the rules before anything acts on them. Remote work stays behind typed client ports.
 */

import * as chatChatBotValidationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as fuelFuelCardServiceApi from "../../../../.cache/proto/acme/fuel/v1/fuel_card_service.js";
import * as keymanagementCryptoKeyCalculationServiceApi from "../../../../.cache/proto/acme/keymanagement/v1/crypto_key_calculation_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import * as webhooksWebhookEndpointQueryServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_query_service.js";
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
import { toFormFieldRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form field operations and persist audit data.
 */
@injectable()
export class FormFieldValidationWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.fuel.v1.FuelCardService") private readonly fuelFuelCardClient: fuelFuelCardServiceApi.FuelCardServiceClient,
    @inject("grpc:acme.keymanagement.v1.CryptoKeyCalculationService") private readonly keymanagementCryptoKeyCalculationClient: keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseQueryService") private readonly surveysSurveyResponseQueryClient: surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointQueryService") private readonly webhooksWebhookEndpointQueryClient: webhooksWebhookEndpointQueryServiceApi.WebhookEndpointQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Checks a form field.
   */
  async checkFormFieldEligibility(req: formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest): Promise<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "CheckFormFieldEligibility", req);
    this.logger.info("check_form_field_eligibility", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fuelFuelCardServiceApi.CloneFuelCardRequest.fromPartial({
      context: req?.context,
      fuelCard: {
        audit: { etag: (req?.formField?.audit?.etag ?? "") },
        contact: {
          name: req?.details?.contact?.name,
          phone: (req?.details?.contact?.phone ?? ""),
        },
      },
    });
    const cloned1: fuelFuelCardServiceApi.CloneFuelCardRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<fuelFuelCardServiceApi.CloneFuelCardRequest, fuelFuelCardServiceApi.CloneFuelCardResponse> =
      (input, done) => this.fuelFuelCardClient.cloneFuelCard(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<fuelFuelCardServiceApi.CloneFuelCardRequest, fuelFuelCardServiceApi.CloneFuelCardResponse>(invoke1, cloned1);
    const request2 = surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.formField?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.fuelCard?.labels ?? {}))),
      },
    });
    const decoded2 = surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest.fromJSON(
      JSON.parse(JSON.stringify(surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest.toJSON(request2))),
    );
    const invoke2: Unary<surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.FindSurveyResponsesResponse> =
      (input, done) => this.surveysSurveyResponseQueryClient.findSurveyResponses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<surveysSurveyResponseQueryServiceApi.FindSurveyResponsesRequest, surveysSurveyResponseQueryServiceApi.FindSurveyResponsesResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse.fromPartial({
        formField: { audit: { etag: (reply1?.fuelCard?.audit?.etag ?? "") } },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          version: (req?.formField?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Explains a form field.
   */
  async explainFormFieldDecision(req: formsFormFieldValidationServiceApi.ExplainFormFieldDecisionRequest): Promise<formsFormFieldValidationServiceApi.ExplainFormFieldDecisionResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "ExplainFormFieldDecision", req);
    this.logger.info("explain_form_field_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest.fromPartial({
      context: req?.context,
      cryptoKey: {
        audit: {
          createdAt: req?.formField?.audit?.createdAt,
          etag: (req?.formField?.audit?.etag ?? ""),
        },
        holder: { displayName: (req?.formField?.owner?.displayName ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.keymanagement.v1.SimulateCryptoKeyRequest",
      value: Buffer.from(keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest.encode(request1).finish()),
    });
    const unpacked1 = keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest.decode(envelope1.value);
    const invoke1: Unary<keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyResponse> =
      (input, done) => this.keymanagementCryptoKeyCalculationClient.simulateCryptoKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldValidationServiceApi.ExplainFormFieldDecisionResponse.fromPartial({
        formField: { audit: { etag: (reply1?.cryptoKey?.audit?.etag ?? "") } },
      }),
      formsFormFieldValidationServiceApi.ExplainFormFieldDecisionResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          owner: req?.formField?.owner,
        },
      }),
    );
  }

  /**
   * Returns a form field.
   */
  async getFormFieldRules(req: formsFormFieldValidationServiceApi.GetFormFieldRulesRequest): Promise<formsFormFieldValidationServiceApi.GetFormFieldRulesResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormFieldRules", req);
    this.logger.info("get_form_field_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    return formsFormFieldValidationServiceApi.GetFormFieldRulesResponse.fromPartial({ formField: { formFieldId: (req?.formFieldId ?? "") } });
  }

  /**
   * Lints a form field.
   */
  async lintFormFields(req: formsFormFieldValidationServiceApi.LintFormFieldsRequest): Promise<formsFormFieldValidationServiceApi.LintFormFieldsResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "LintFormFields", req);
    this.logger.info("lint_form_fields", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexQueryServiceApi.CountSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.formField?.audit?.updatedAt },
    });
    const client1 = this.clients.get<searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient>("acme.search.v1.SearchIndexQueryService");
    const invoke1: Unary<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse> =
      (input, done) => client1.countSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse>(invoke1, request1);
    const request2 = metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.contact?.preferredChannel ?? "") },
      },
      metricSeries: {
        audit: { createdAt: req?.formField?.audit?.createdAt },
        components: { primary: { description: (req?.formField?.description ?? "") } },
      },
    });
    const invoke2: Unary<metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesValidationClient.normalizeMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.NormalizeMetricSeriesResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldValidationServiceApi.LintFormFieldsResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      formsFormFieldValidationServiceApi.LintFormFieldsResponse.fromPartial({
        formField: { audit: { etag: (reply2?.metricSeries?.audit?.etag ?? "") } },
        result: { status: (reply2?.outcome?.status ?? "") },
      }),
      formsFormFieldValidationServiceApi.LintFormFieldsResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          owner: req?.formField?.owner,
        },
      }),
    );
  }

  /**
   * Normalizes a form field.
   */
  async normalizeFormField(req: formsFormFieldValidationServiceApi.NormalizeFormFieldRequest): Promise<formsFormFieldValidationServiceApi.NormalizeFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "NormalizeFormField", req);
    this.logger.info("normalize_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest.fromPartial({
      context: req?.context,
      cryptoKey: {
        audit: { createdBy: (req?.formField?.audit?.createdBy ?? "") },
        contact: { name: req?.details?.contact?.name },
        holder: { displayName: (req?.formField?.owner?.displayName ?? "") },
      },
    });
    const invoke1: Unary<keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyResponse> =
      (input, done) => this.keymanagementCryptoKeyCalculationClient.simulateCryptoKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyResponse>(invoke1, request1));
    const request2 = webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.formField?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.cryptoKey?.labels ?? {}))),
        ownerId: (reply1?.cryptoKey?.holder?.keyRingId ?? ""),
      },
    });
    const invoke2: Unary<webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse> =
      (input, done) => this.webhooksWebhookEndpointQueryClient.suggestWebhookEndpoints(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("NormalizeFormField.SuggestWebhookEndpoints", () => call<webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsRequest, webhooksWebhookEndpointQueryServiceApi.SuggestWebhookEndpointsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldValidationServiceApi.NormalizeFormFieldResponse.fromPartial({
        formField: { owner: { email: (reply1?.cryptoKey?.contact?.email ?? "") } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      formsFormFieldValidationServiceApi.NormalizeFormFieldResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      formsFormFieldValidationServiceApi.NormalizeFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          priority: (req?.formField?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Previews a form field.
   */
  async previewFormField(req: formsFormFieldValidationServiceApi.PreviewFormFieldRequest): Promise<formsFormFieldValidationServiceApi.PreviewFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "PreviewFormField", req);
    this.logger.info("preview_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest.fromPartial({
      context: req?.context,
      formSubmission: { subject: { displayName: (req?.formField?.owner?.displayName ?? "") } },
    });
    const invoke1: Unary<formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest, formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionValidationClient.scoreFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldValidationServiceApi.PreviewFormFieldResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      formsFormFieldValidationServiceApi.PreviewFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          version: (req?.formField?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Validates a form field.
   */
  async validateFormField(req: formsFormFieldValidationServiceApi.ValidateFormFieldRequest): Promise<formsFormFieldValidationServiceApi.ValidateFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "ValidateFormField", req);
    this.logger.info("validate_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          name: req?.details?.contact?.name,
        },
        strict: (req?.details?.strict ?? false),
      },
    });
    const reply1 = await this.workQueue.enqueue<formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest, formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse>(
      "acme.forms.v1.FormFieldValidationService/ValidateFormField:0", request1,
    );
    const request2 = chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest.fromPartial({
      chatBot: { audit: { updatedBy: (req?.formField?.audit?.updatedBy ?? "") } },
      context: req?.context,
    });
    const invoke2: Unary<chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest, chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse> =
      (input, done) => this.chatChatBotValidationClient.checkChatBotEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<chatChatBotValidationServiceApi.CheckChatBotEligibilityRequest, chatChatBotValidationServiceApi.CheckChatBotEligibilityResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldValidationServiceApi.ValidateFormFieldResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      formsFormFieldValidationServiceApi.ValidateFormFieldResponse.fromPartial({ outcome: { message: (reply2?.outcome?.message ?? "") } }),
      formsFormFieldValidationServiceApi.ValidateFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          name: (req?.formField?.name ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for FormFieldValidationService; workflows own validation and database transactions.
 */
@injectable()
export class FormFieldValidationHandler {
  constructor(@inject(FormFieldValidationWorkflow) private readonly workflow: FormFieldValidationWorkflow) {}

  /**
   * Checks a form field.
   */
  checkFormFieldEligibility = unary<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest, formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse>(
    (request) => this.workflow.checkFormFieldEligibility(request),
  );

  /**
   * Explains a form field.
   */
  explainFormFieldDecision = unary<formsFormFieldValidationServiceApi.ExplainFormFieldDecisionRequest, formsFormFieldValidationServiceApi.ExplainFormFieldDecisionResponse>(
    (request) => this.workflow.explainFormFieldDecision(request),
  );

  /**
   * Returns a form field.
   */
  getFormFieldRules = (call: ServerUnaryCall<formsFormFieldValidationServiceApi.GetFormFieldRulesRequest, formsFormFieldValidationServiceApi.GetFormFieldRulesResponse>, done: sendUnaryData<formsFormFieldValidationServiceApi.GetFormFieldRulesResponse>): void => {
    void this.workflow.getFormFieldRules(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Lints a form field.
   */
  lintFormFields = unary<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse>(
    (request) => this.workflow.lintFormFields(request),
  );

  /**
   * Normalizes a form field.
   */
  normalizeFormField = unary<formsFormFieldValidationServiceApi.NormalizeFormFieldRequest, formsFormFieldValidationServiceApi.NormalizeFormFieldResponse>(
    (request) => this.workflow.normalizeFormField(request),
  );

  /**
   * Previews a form field.
   */
  previewFormField = (call: ServerUnaryCall<formsFormFieldValidationServiceApi.PreviewFormFieldRequest, formsFormFieldValidationServiceApi.PreviewFormFieldResponse>, done: sendUnaryData<formsFormFieldValidationServiceApi.PreviewFormFieldResponse>): void => {
    void this.workflow.previewFormField(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates a form field.
   */
  validateFormField = unary<formsFormFieldValidationServiceApi.ValidateFormFieldRequest, formsFormFieldValidationServiceApi.ValidateFormFieldResponse>(
    (request) => this.workflow.validateFormField(request),
  );
}

export function implementation(handler: FormFieldValidationHandler): formsFormFieldValidationServiceApi.FormFieldValidationServiceServer {
  return {
    checkFormFieldEligibility: handler.checkFormFieldEligibility,
    explainFormFieldDecision: handler.explainFormFieldDecision,
    getFormFieldRules: handler.getFormFieldRules,
    lintFormFields: handler.lintFormFields,
    normalizeFormField: handler.normalizeFormField,
    previewFormField: handler.previewFormField,
    validateFormField: handler.validateFormField,
  };
}
