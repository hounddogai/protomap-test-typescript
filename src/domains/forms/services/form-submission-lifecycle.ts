/**
 * Moves a form submission between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as formsFormCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as formsFormSubmissionLifecycleServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_lifecycle_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
import * as surveysSurveyResponseApprovalServiceApi from "../../../../.cache/proto/acme/surveys/v1/survey_response_approval_service.js";
import * as venuesVenueServiceApi from "../../../../.cache/proto/acme/venues/v1/venue_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../platform/rpc.js";
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toFormSubmissionRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form submission operations and persist audit data.
 */
@injectable()
export class FormSubmissionLifecycleWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormQueryService") private readonly formsFormQueryClient: formsFormQueryServiceApi.FormQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.sponsorships.v1.SponsorCalculationService") private readonly sponsorshipsSponsorCalculationClient: sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient,
    @inject("grpc:acme.surveys.v1.SurveyResponseApprovalService") private readonly surveysSurveyResponseApprovalClient: surveysSurveyResponseApprovalServiceApi.SurveyResponseApprovalServiceClient,
    @inject("grpc:acme.venues.v1.VenueService") private readonly venuesVenueClient: venuesVenueServiceApi.VenueServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a form submission.
   */
  async activateFormSubmission(req: formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest): Promise<formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateFormSubmission", req);
    this.logger.info("activate_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.CalculateFormRequest.fromPartial({
      context: req?.context,
      form: { counterparty: { email: (req?.details?.notifyContact?.email ?? "") } },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.CalculateFormRequest, formsFormCalculationServiceApi.CalculateFormResponse> =
      (input, done) => this.formsFormCalculationClient.calculateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ActivateFormSubmission.CalculateForm", () => call<formsFormCalculationServiceApi.CalculateFormRequest, formsFormCalculationServiceApi.CalculateFormResponse>(invoke1, request1));
    const request2 = customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.newOwner?.email ?? "") } },
      preference: {
        audit: {
          createdAt: reply1?.form?.audit?.createdAt,
          createdBy: (reply1?.form?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.form?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke2: Unary<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse> =
      (input, done) => this.customersPreferenceValidationClient.explainPreferenceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    const request3 = personalizationAffinitySyncServiceApi.StreamAffinityChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
        subject: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream3 = this.personalizationAffinitySyncClient.streamAffinityChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse.fromPartial({ outcome: { status: (reply2?.outcome?.status ?? "") } }),
      formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse.fromPartial({
        formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a form submission.
   */
  async expireFormSubmission(req: formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionRequest): Promise<formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireFormSubmission", req);
    this.logger.info("expire_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest, personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse>(
      "acme.forms.v1.FormSubmissionLifecycleService/ExpireFormSubmission:0", request1,
    );
    const request2 = formsFormValidationServiceApi.ValidateFormRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.newOwner?.email ?? ""),
          phone: (req?.details?.notifyContact?.phone ?? ""),
        },
      },
      form: {
        counterparty: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.notifyContact?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<formsFormValidationServiceApi.ValidateFormRequest, formsFormValidationServiceApi.ValidateFormResponse> =
      (input, done) => this.formsFormValidationClient.validateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<formsFormValidationServiceApi.ValidateFormRequest, formsFormValidationServiceApi.ValidateFormResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionResponse.fromPartial({
        outcome: { message: (reply2?.outcome?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionResponse.fromPartial({
        formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a form submission.
   */
  async getFormSubmissionLifecycle(req: formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleRequest): Promise<formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormSubmissionLifecycle", req);
    this.logger.info("get_form_submission_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    return formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleResponse.fromPartial({ formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") } });
  }

  /**
   * Reinstates a form submission.
   */
  async reinstateFormSubmission(req: formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionRequest): Promise<formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateFormSubmission", req);
    this.logger.info("reinstate_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormQueryServiceApi.BrowseFormsRequest.fromPartial({
      context: req?.context,
      filter: { ownerId: (req?.details?.newOwner?.userId ?? "") },
    });
    const invoke1: Unary<formsFormQueryServiceApi.BrowseFormsRequest, formsFormQueryServiceApi.BrowseFormsResponse> =
      (input, done) => this.formsFormQueryClient.browseForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<formsFormQueryServiceApi.BrowseFormsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest.fromPartial({
      context: req?.context,
      sponsor: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
        relationshipManager: {
          email: (req?.details?.notifyContact?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest, sponsorshipsSponsorCalculationServiceApi.SimulateSponsorResponse> =
      (input, done) => this.sponsorshipsSponsorCalculationClient.simulateSponsor(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = formsFormValidationServiceApi.ExplainFormDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      form: {
        audit: { createdAt: reply2?.sponsor?.audit?.createdAt },
        billingAddress: { region: (reply2?.sponsor?.primaryAddress?.region ?? "") },
      },
    });
    const invoke3: Unary<formsFormValidationServiceApi.ExplainFormDecisionRequest, formsFormValidationServiceApi.ExplainFormDecisionResponse> =
      (input, done) => this.formsFormValidationClient.explainFormDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse.fromPartial({
        formSubmission: { correlationId: (reply1?.result?.correlationId ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse.fromPartial({
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse.fromPartial({
        formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a form submission.
   */
  async scheduleFormSubmissionExpiry(req: formsFormSubmissionLifecycleServiceApi.ScheduleFormSubmissionExpiryRequest): Promise<formsFormSubmissionLifecycleServiceApi.ScheduleFormSubmissionExpiryResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "ScheduleFormSubmissionExpiry", req);
    this.logger.info("schedule_form_submission_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.formSubmission?.measurements ?? []).map(async (item) => {
      const request1 = surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalRequest.fromPartial({
        context: req?.context,
        surveyResponse: {
          measurements: [{
            observedAt: item?.observedAt,
            unit: (item?.unit ?? ""),
            value: (item?.value ?? 0),
          }],
        },
      });
      const invoke1: Unary<surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalRequest, surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse> =
        (input, done) => this.surveysSurveyResponseApprovalClient.commentSurveyResponseApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalRequest, surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? surveysSurveyResponseApprovalServiceApi.CommentSurveyResponseApprovalResponse.fromPartial({});
    const request2 = customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest.fromPartial({
      consentRecord: {
        attributes: Object.fromEntries(Object.entries((reply1?.surveyResponse?.attributes ?? {}))),
        subject: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        contact: {
          email: (reply1?.surveyResponse?.subject?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const method2 = "validateConsentRecord" as const;
    const invoke2: Unary<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionLifecycleServiceApi.ScheduleFormSubmissionExpiryResponse.fromPartial({
        formSubmission: { sequence: (reply2?.consentRecord?.sequence ?? 0) },
        result: { message: (reply2?.outcome?.message ?? "") },
      }),
      formsFormSubmissionLifecycleServiceApi.ScheduleFormSubmissionExpiryResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          kind: (req?.formSubmission?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Suspends a form submission.
   */
  async suspendFormSubmission(req: formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionRequest): Promise<formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendFormSubmission", req);
    this.logger.info("suspend_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormQueryServiceApi.ExportFormsRequest.fromPartial({
      context: req?.context,
      filter: { createdAfter: req?.details?.effectiveAt },
    });
    const stream1 = this.formsFormQueryClient.exportForms(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? formsFormQueryServiceApi.ExportFormsResponse.fromPartial({});
    const request2 = customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.fromPartial({
      context: req?.context,
      preference: {
        action: { $case: "block", block: { reason: (req?.reason ?? "") } },
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.customersPreferenceCalculationClient);
    const invoke2: Unary<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse> =
      (input, done) => proxy2.simulatePreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.preferredChannel ?? "") });
    return mergeResponses(
      formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionResponse.fromPartial({
        formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Terminates a form submission.
   */
  async terminateFormSubmission(req: formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionRequest): Promise<formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "TerminateFormSubmission", req);
    this.logger.info("terminate_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = venuesVenueServiceApi.UpdateVenueRequest.fromPartial({
      context: req?.context,
      venue: {
        owner: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          email: (req?.details?.newOwner?.email ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<venuesVenueServiceApi.UpdateVenueRequest, venuesVenueServiceApi.UpdateVenueResponse> =
      (input, done) => this.venuesVenueClient.updateVenue(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<venuesVenueServiceApi.UpdateVenueRequest, venuesVenueServiceApi.UpdateVenueResponse>(invoke1, request1);
    const request2 = venuesVenueServiceApi.SearchVenuesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        region: ((reply1?.venue?.locator?.$case === "address" ? reply1?.venue?.locator.address : undefined)?.region ?? ""),
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<venuesVenueServiceApi.SearchVenuesRequest, venuesVenueServiceApi.SearchVenuesResponse> =
      (input, done) => this.venuesVenueClient.searchVenues(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<venuesVenueServiceApi.SearchVenuesRequest, venuesVenueServiceApi.SearchVenuesResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionResponse.fromPartial({
        formSubmission: { correlationId: (reply2?.result?.correlationId ?? "") },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionResponse.fromPartial({
        formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}

/**
 * The gRPC boundary for FormSubmissionLifecycleService; workflows own validation and database transactions.
 */
@injectable()
export class FormSubmissionLifecycleHandler {
  constructor(@inject(FormSubmissionLifecycleWorkflow) private readonly workflow: FormSubmissionLifecycleWorkflow) {}

  /**
   * Activates a form submission.
   */
  activateFormSubmission = unary<formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse>(
    (request) => this.workflow.activateFormSubmission(request),
  );

  /**
   * Expires a form submission.
   */
  expireFormSubmission = unary<formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionResponse>(
    (request) => this.workflow.expireFormSubmission(request),
  );

  /**
   * Returns a form submission.
   */
  getFormSubmissionLifecycle = (call: ServerUnaryCall<formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleRequest, formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleResponse>, done: sendUnaryData<formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleResponse>): void => {
    void this.workflow.getFormSubmissionLifecycle(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Reinstates a form submission.
   */
  reinstateFormSubmission = unary<formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse>(
    (request) => this.workflow.reinstateFormSubmission(request),
  );

  /**
   * Schedules a form submission.
   */
  scheduleFormSubmissionExpiry = unary<formsFormSubmissionLifecycleServiceApi.ScheduleFormSubmissionExpiryRequest, formsFormSubmissionLifecycleServiceApi.ScheduleFormSubmissionExpiryResponse>(
    (request) => this.workflow.scheduleFormSubmissionExpiry(request),
  );

  /**
   * Suspends a form submission.
   */
  suspendFormSubmission = (call: ServerUnaryCall<formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionResponse>, done: sendUnaryData<formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionResponse>): void => {
    void this.workflow.suspendFormSubmission(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Terminates a form submission.
   */
  terminateFormSubmission = unary<formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionResponse>(
    (request) => this.workflow.terminateFormSubmission(request),
  );
}

export function implementation(handler: FormSubmissionLifecycleHandler): formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceServer {
  return {
    activateFormSubmission: handler.activateFormSubmission,
    expireFormSubmission: handler.expireFormSubmission,
    getFormSubmissionLifecycle: handler.getFormSubmissionLifecycle,
    reinstateFormSubmission: handler.reinstateFormSubmission,
    scheduleFormSubmissionExpiry: handler.scheduleFormSubmissionExpiry,
    suspendFormSubmission: handler.suspendFormSubmission,
    terminateFormSubmission: handler.terminateFormSubmission,
  };
}
