/**
 * Answers read-only questions about forms, for screens and reports. Remote work stays behind typed client ports.
 */

import * as formsFormCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as formsFormQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as venuesVenueServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { FormsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form operations and persist audit data.
 */
@injectable()
export class FormQueryWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldCalculationService") private readonly formsFormFieldCalculationClient: formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists forms a page at a time.
   */
  async browseForms(req: formsFormQueryServiceApi.BrowseFormsRequest): Promise<formsFormQueryServiceApi.BrowseFormsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseForms", req);
    this.logger.info("browse_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldCalculationServiceApi.CalculateFormFieldRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<formsFormFieldCalculationServiceApi.CalculateFormFieldRequest, formsFormFieldCalculationServiceApi.CalculateFormFieldResponse>(
      "acme.forms.v1.FormQueryService/BrowseForms:0", request1,
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return formsFormQueryServiceApi.BrowseFormsResponse.fromPartial({
      forms: [{ counterparty: { email: (reply1?.formField?.owner?.email ?? "") } }],
    });
  }

  /**
   * Streams every matching form.
   */
  async exportForms(req: formsFormQueryServiceApi.ExportFormsRequest): Promise<formsFormQueryServiceApi.ExportFormsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportForms", req);
    this.logger.info("export_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormValidationServiceApi.LintFormsRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      form: { billingAddress: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<formsFormValidationServiceApi.LintFormsRequest, formsFormValidationServiceApi.LintFormsResponse> =
      (input, done) => this.formsFormValidationClient.lintForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<formsFormValidationServiceApi.LintFormsRequest, formsFormValidationServiceApi.LintFormsResponse>(invoke1, request1));
    const request2 = formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply1?.form?.counterparty?.email ?? "") } },
    });
    const invoke2: Unary<formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionRequest, formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionResponse> =
      (input, done) => this.formsFormSubmissionValidationClient.explainFormSubmissionDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<formsFormSubmissionValidationServiceApi.ExplainFormSubmissionDecisionResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      formsFormQueryServiceApi.ExportFormsResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      formsFormQueryServiceApi.ExportFormsResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      formsFormQueryServiceApi.ExportFormsResponse.fromPartial({ form: { billingAddress: { region: (req?.filter?.region ?? "") } } }),
    );
  }

  /**
   * Returns a form.
   */
  async lookupForm(req: formsFormQueryServiceApi.LookupFormRequest): Promise<formsFormQueryServiceApi.LookupFormResponse> {
    validateContext(req.context);
    if (!req.formId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupForm", req);
    this.logger.info("lookup_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.RecalculateFormsRequest.fromPartial({
      context: req?.context,
      form: {
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        formId: (req?.formId ?? ""),
      },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.RecalculateFormsRequest, formsFormCalculationServiceApi.RecalculateFormsResponse> =
      (input, done) => this.formsFormCalculationClient.recalculateForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      formsFormQueryServiceApi.LookupFormResponse.fromPartial({
        form: { audit: { createdAt: reply1?.form?.audit?.createdAt } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      formsFormQueryServiceApi.LookupFormResponse.fromPartial({ form: { formId: (req?.formId ?? "") } }),
    );
  }

  /**
   * Returns several forms at once.
   */
  async resolveForms(req: formsFormQueryServiceApi.ResolveFormsRequest): Promise<formsFormQueryServiceApi.ResolveFormsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveForms", req);
    this.logger.info("resolve_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldValidationServiceApi.LintFormFieldsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      formField: {
        owner: { userId: (req?.context?.actor?.userId ?? "") },
        scopes: (req?.formIds ?? []).map((value) => value),
      },
    });
    const invoke1: Unary<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse> =
      (input, done) => this.formsFormFieldValidationClient.lintFormFields(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return formsFormQueryServiceApi.ResolveFormsResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        message: (reply1?.result?.message ?? ""),
      },
    });
  }

  /**
   * Lists forms a page at a time.
   */
  async suggestForms(req: formsFormQueryServiceApi.SuggestFormsRequest): Promise<formsFormQueryServiceApi.SuggestFormsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestForms", req);
    this.logger.info("suggest_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return formsFormQueryServiceApi.SuggestFormsResponse.fromPartial({});
  }

  /**
   * Summarizes a form.
   */
  async summarizeForms(req: formsFormQueryServiceApi.SummarizeFormsRequest): Promise<formsFormQueryServiceApi.SummarizeFormsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeForms", req);
    this.logger.info("summarize_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormValidationServiceApi.GetFormRulesRequest.fromPartial({
      context: req?.context,
      formId: (req?.formId ?? ""),
    });
    const method1 = "getFormRules" as const;
    const invoke1: Unary<formsFormValidationServiceApi.GetFormRulesRequest, formsFormValidationServiceApi.GetFormRulesResponse> =
      (input, done) => this.formsFormValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormValidationServiceApi.GetFormRulesRequest, formsFormValidationServiceApi.GetFormRulesResponse>(invoke1, request1);
    const request2 = venuesVenueServiceApi.UpdateVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        locator: { $case: "address", address: { countryCode: (reply1?.form?.billingAddress?.countryCode ?? "") } },
        audit: { etag: (reply1?.form?.audit?.etag ?? "") },
      },
    });
    const proxy2 = forwarding(this.venuesVenueClient);
    const invoke2: Unary<venuesVenueServiceApi.UpdateVenueRequest, venuesVenueServiceApi.UpdateVenueResponse> =
      (input, done) => proxy2.updateVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<venuesVenueServiceApi.UpdateVenueRequest, venuesVenueServiceApi.UpdateVenueResponse>(invoke2, request2);
    const request3 = notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (reply1?.form?.counterparty?.email ?? "") } },
    });
    const invoke3: Unary<notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.resumeDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.ResumeDeliveryAttemptWorkflowResponse>(invoke3, request3);
    const request4 = formsFormFieldCalculationServiceApi.SimulateFormFieldRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.form?.billingAddress?.lines ?? []).map((value) => value),
          recipient: (reply1?.form?.billingAddress?.recipient ?? ""),
        },
      },
      formField: {
        owner: { displayName: (reply1?.form?.counterparty?.displayName ?? "") },
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<formsFormFieldCalculationServiceApi.SimulateFormFieldRequest, formsFormFieldCalculationServiceApi.SimulateFormFieldResponse> =
      (input, done) => this.formsFormFieldCalculationClient.simulateFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<formsFormFieldCalculationServiceApi.SimulateFormFieldRequest, formsFormFieldCalculationServiceApi.SimulateFormFieldResponse>(invoke4, spread4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormQueryServiceApi.SummarizeFormsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      formsFormQueryServiceApi.SummarizeFormsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      formsFormQueryServiceApi.SummarizeFormsResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      formsFormQueryServiceApi.SummarizeFormsResponse.fromPartial({ result: { details: (reply4?.result?.details ?? {}) } }),
      formsFormQueryServiceApi.SummarizeFormsResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
