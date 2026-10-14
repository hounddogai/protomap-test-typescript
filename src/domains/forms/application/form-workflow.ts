/**
 * Runs the long-lived workflow that takes a form from start to finish. Remote work stays behind typed client ports.
 */

import * as anomaliesAnomalyServiceApi from "../../../../.cache/proto/acme/anomalies/v1/anomaly_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as formsFormApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as formsFormCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormSubmissionApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as formsFormWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import * as labelingLabelingTaskCalculationServiceApi from "../../../../.cache/proto/acme/labeling/v1/labeling_task_calculation_service.js";
import * as surveysSurveyResponseWorkflowServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import * as toursTourServiceApi from "../../../../.cache/proto/acme/tours/v1/tour_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
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
import { toFormRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form operations and persist audit data.
 */
@injectable()
export class FormWorkflowWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.anomalies.v1.AnomalyService") private readonly anomaliesAnomalyClient: anomaliesAnomalyServiceApi.AnomalyServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdCalculationService") private readonly customersHouseholdCalculationClient: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormApprovalService") private readonly formsFormApprovalClient: formsFormApprovalServiceApi.FormApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionApprovalService") private readonly formsFormSubmissionApprovalClient: formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.labeling.v1.LabelingTaskCalculationService") private readonly labelingLabelingTaskCalculationClient: labelingLabelingTaskCalculationServiceApi.LabelingTaskCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseWorkflowService") private readonly surveysSurveyResponseWorkflowClient: surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceClient,
    @inject("grpc:acme.tours.v1.TourService") private readonly toursTourClient: toursTourServiceApi.TourServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a form.
   */
  async advanceFormWorkflow(req: formsFormWorkflowServiceApi.AdvanceFormWorkflowRequest): Promise<formsFormWorkflowServiceApi.AdvanceFormWorkflowResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "AdvanceFormWorkflow", req);
    this.logger.info("advance_form_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.form?.billingAddress?.lines ?? []).map((value) => value),
          locality: (req?.form?.billingAddress?.locality ?? ""),
          postalCode: (req?.form?.billingAddress?.postalCode ?? ""),
        },
      },
    });
    const invoke1: Unary<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.quoteConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<customersConsentRecordCalculationServiceApi.QuoteConsentRecordRequest, customersConsentRecordCalculationServiceApi.QuoteConsentRecordResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = formsFormValidationServiceApi.LintFormsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
      form: {
        settlement: { $case: "card", card: {
          network: ((req?.form?.settlement?.$case === "card" ? req?.form?.settlement.card : undefined)?.network ?? ""),
        } },
        counterparty: { email: (req?.form?.counterparty?.email ?? "") },
      },
    });
    const invoke2: Unary<formsFormValidationServiceApi.LintFormsRequest, formsFormValidationServiceApi.LintFormsResponse> =
      (input, done) => this.formsFormValidationClient.lintForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<formsFormValidationServiceApi.LintFormsRequest, formsFormValidationServiceApi.LintFormsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormWorkflowServiceApi.AdvanceFormWorkflowResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      formsFormWorkflowServiceApi.AdvanceFormWorkflowResponse.fromPartial({
        form: {
          billingAddress: { postalCode: (reply2?.form?.billingAddress?.postalCode ?? "") },
        },
      }),
      formsFormWorkflowServiceApi.AdvanceFormWorkflowResponse.fromPartial({
        form: {
          dueAt: req?.form?.dueAt,
          formId: (req?.formId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a form.
   */
  async cancelFormWorkflow(req: formsFormWorkflowServiceApi.CancelFormWorkflowRequest): Promise<formsFormWorkflowServiceApi.CancelFormWorkflowResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "CancelFormWorkflow", req);
    this.logger.info("cancel_form_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest, anomaliesAnomalyServiceApi.BatchGetAnomaliesResponse> =
      (input, done) => this.anomaliesAnomalyClient.batchGetAnomalies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CancelFormWorkflow.BatchGetAnomalies", () => call<anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest, anomaliesAnomalyServiceApi.BatchGetAnomaliesResponse>(invoke1, request1));
    const request2 = labelingLabelingTaskCalculationServiceApi.SimulateLabelingTaskRequest.fromPartial({
      context: req?.context,
      labelingTask: {
        assignee: { email: (req?.form?.counterparty?.email ?? "") },
        audit: { updatedAt: req?.form?.audit?.updatedAt },
      },
    });
    const invoke2: Unary<labelingLabelingTaskCalculationServiceApi.SimulateLabelingTaskRequest, labelingLabelingTaskCalculationServiceApi.SimulateLabelingTaskResponse> =
      (input, done) => this.labelingLabelingTaskCalculationClient.simulateLabelingTask(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormWorkflowServiceApi.CancelFormWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      formsFormWorkflowServiceApi.CancelFormWorkflowResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      formsFormWorkflowServiceApi.CancelFormWorkflowResponse.fromPartial({
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
  async inspectFormWorkflow(req: formsFormWorkflowServiceApi.InspectFormWorkflowRequest): Promise<formsFormWorkflowServiceApi.InspectFormWorkflowResponse> {
    validateContext(req.context);
    if (!req.formId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectFormWorkflow", req);
    this.logger.info("inspect_form_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      formSubmission: { source: (req?.formId ?? "") },
    });
    const reply1 = await this.workQueue.enqueue<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse>(
      "acme.forms.v1.FormWorkflowService/InspectFormWorkflow:0", request1,
    );
    return mergeResponses(
      formsFormWorkflowServiceApi.InspectFormWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormWorkflowServiceApi.InspectFormWorkflowResponse.fromPartial({ form: { formId: (req?.formId ?? "") } }),
    );
  }

  /**
   * Lists forms a page at a time.
   */
  async listFormWorkflows(req: formsFormWorkflowServiceApi.ListFormWorkflowsRequest): Promise<formsFormWorkflowServiceApi.ListFormWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListFormWorkflows", req);
    this.logger.info("list_form_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      details: { destination: { region: (req?.filter?.region ?? "") } },
    });
    const invoke1: Unary<customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.quoteCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return formsFormWorkflowServiceApi.ListFormWorkflowsResponse.fromPartial({
      result: {
        details: (reply1?.result?.details ?? {}),
        message: (reply1?.result?.message ?? ""),
      },
    });
  }

  /**
   * Pauses a form.
   */
  async pauseFormWorkflow(req: formsFormWorkflowServiceApi.PauseFormWorkflowRequest): Promise<formsFormWorkflowServiceApi.PauseFormWorkflowResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "PauseFormWorkflow", req);
    this.logger.info("pause_form_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.ExplainFormCalculationRequest.fromPartial({
      context: req?.context,
      form: { audit: { createdAt: req?.form?.audit?.createdAt } },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse> =
      (input, done) => this.formsFormCalculationClient.explainFormCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<formsFormCalculationServiceApi.ExplainFormCalculationResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest.fromPartial({
      consentRecord: {
        subject: { displayName: (req?.form?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.form?.counterparty?.email ?? ""),
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const invoke2: Unary<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.validateConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const results3 = await Promise.all((req?.form?.lines ?? []).map(async (item) => {
      const request3 = surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowRequest.fromPartial({
        context: req?.context,
        surveyResponse: {
          attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
        },
      });
      const invoke3: Unary<surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse> =
        (input, done) => this.surveysSurveyResponseWorkflowClient.pauseSurveyResponseWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? surveysSurveyResponseWorkflowServiceApi.PauseSurveyResponseWorkflowResponse.fromPartial({});
    const request4 = formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (reply2?.consentRecord?.subject?.displayName ?? "") },
      },
      formSubmission: {
        subject: { displayName: (req?.form?.counterparty?.displayName ?? "") },
      },
    });
    const invoke4: Unary<formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionApprovalClient.approveFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke4 = promisify(invoke4);
    const reply4 = requireReply(await asyncInvoke4(request4));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormWorkflowServiceApi.PauseFormWorkflowResponse.fromPartial({
        form: { metadata: (reply1?.form?.metadata ?? {}) },
        outcome: { message: (reply1?.result?.message ?? "") },
      }),
      formsFormWorkflowServiceApi.PauseFormWorkflowResponse.fromPartial({ outcome: { effectiveAt: reply2?.outcome?.effectiveAt } }),
      formsFormWorkflowServiceApi.PauseFormWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply4?.formSubmission?.correlationId ?? ""),
          details: (reply4?.result?.details ?? {}),
        },
      }),
      formsFormWorkflowServiceApi.PauseFormWorkflowResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          status: req?.form?.status,
        },
      }),
    );
  }

  /**
   * Retrys a form.
   */
  async retryFormWorkflow(req: formsFormWorkflowServiceApi.RetryFormWorkflowRequest): Promise<formsFormWorkflowServiceApi.RetryFormWorkflowResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "RetryFormWorkflow", req);
    this.logger.info("retry_form_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.form?.lines ?? []).map(async (item) => {
      const request1 = customersPreferenceValidationServiceApi.CheckPreferenceEligibilityRequest.fromPartial({
        context: req?.context,
        preference: {
          audit: { createdAt: req?.form?.audit?.createdAt },
          description: (item?.description ?? ""),
          action: { $case: "discount", discount: { amount: item?.tax?.amount } },
        },
      });
      const invoke1: Unary<customersPreferenceValidationServiceApi.CheckPreferenceEligibilityRequest, customersPreferenceValidationServiceApi.CheckPreferenceEligibilityResponse> =
        (input, done) => this.customersPreferenceValidationClient.checkPreferenceEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<customersPreferenceValidationServiceApi.CheckPreferenceEligibilityRequest, customersPreferenceValidationServiceApi.CheckPreferenceEligibilityResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: customersPreferenceValidationServiceApi.CheckPreferenceEligibilityResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? customersPreferenceValidationServiceApi.CheckPreferenceEligibilityResponse.fromPartial({});
    const request2 = formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
      formSubmission: {
        subject: { displayName: (req?.form?.counterparty?.displayName ?? "") },
      },
    });
    const method2 = "checkFormSubmissionEligibility" as const;
    const invoke2: Unary<formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityRequest, formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse> =
      (input, done) => this.formsFormSubmissionValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityRequest, formsFormSubmissionValidationServiceApi.CheckFormSubmissionEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormWorkflowServiceApi.RetryFormWorkflowResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      formsFormWorkflowServiceApi.RetryFormWorkflowResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          metadata: (req?.form?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Signals a form.
   */
  async signalFormWorkflow(req: formsFormWorkflowServiceApi.SignalFormWorkflowRequest): Promise<formsFormWorkflowServiceApi.SignalFormWorkflowResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "SignalFormWorkflow", req);
    this.logger.info("signal_form_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = toursTourServiceApi.ListToursRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.form?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((req?.form?.metadata ?? {}))),
        ownerId: (req?.form?.formId ?? ""),
        region: (req?.form?.billingAddress?.region ?? ""),
      },
    });
    const proxy1 = forwarding(this.toursTourClient);
    const invoke1: Unary<toursTourServiceApi.ListToursRequest, toursTourServiceApi.ListToursResponse> =
      (input, done) => proxy1.listTours(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<toursTourServiceApi.ListToursRequest, toursTourServiceApi.ListToursResponse>(invoke1, request1);
    const request2 = formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
      formSubmission: {
        subject: { displayName: (req?.form?.counterparty?.displayName ?? "") },
      },
    });
    const invoke2: Unary<formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest, formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse> =
      (input, done) => this.formsFormSubmissionValidationClient.lintFormSubmissions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest, formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse>(invoke2, request2);
    const request3 = customersHouseholdCalculationServiceApi.SimulateHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{ children: [{ audit: { etag: (req?.form?.audit?.etag ?? "") } }] }],
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<customersHouseholdCalculationServiceApi.SimulateHouseholdRequest, customersHouseholdCalculationServiceApi.SimulateHouseholdResponse> =
      (input, done) => this.customersHouseholdCalculationClient.simulateHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersHouseholdCalculationServiceApi.SimulateHouseholdRequest, customersHouseholdCalculationServiceApi.SimulateHouseholdResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest.fromPartial({
      context: input4?.context,
      details: {
        approver: { displayName: (input4?.form?.counterparty?.displayName ?? "") },
      },
      formSubmission: {
        subject: {
          displayName: (reply2?.formSubmission?.subject?.displayName ?? ""),
          formFieldId: (reply2?.formSubmission?.subject?.formFieldId ?? ""),
        },
      },
    });
    const invoke4: Unary<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionApprovalClient.recallFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormWorkflowServiceApi.SignalFormWorkflowResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      formsFormWorkflowServiceApi.SignalFormWorkflowResponse.fromPartial({
        result: { correlationId: (reply2?.formSubmission?.correlationId ?? "") },
      }),
      formsFormWorkflowServiceApi.SignalFormWorkflowResponse.fromPartial({
        form: {
          counterparty: { email: (reply3?.household?.manager?.email ?? "") },
          total: reply3?.breakdown?.total,
        },
      }),
      formsFormWorkflowServiceApi.SignalFormWorkflowResponse.fromPartial({
        outcome: { referenceId: (reply4?.outcome?.referenceId ?? "") },
        result: { referenceIds: (reply4?.result?.referenceIds ?? []) },
      }),
      formsFormWorkflowServiceApi.SignalFormWorkflowResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          notes: (req?.form?.notes ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a form.
   */
  async startFormWorkflow(req: formsFormWorkflowServiceApi.StartFormWorkflowRequest): Promise<formsFormWorkflowServiceApi.StartFormWorkflowResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "StartFormWorkflow", req);
    this.logger.info("start_form_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormApprovalServiceApi.EscalateFormRequest.fromPartial({
      context: req?.context,
      form: { audit: { createdBy: (req?.form?.audit?.createdBy ?? "") } },
    });
    const cloned1: formsFormApprovalServiceApi.EscalateFormRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse> =
      (input, done) => this.formsFormApprovalClient.escalateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormWorkflowServiceApi.StartFormWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormWorkflowServiceApi.StartFormWorkflowResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          notes: (req?.form?.notes ?? ""),
        },
      }),
    );
  }
}
