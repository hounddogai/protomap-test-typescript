/**
 * Runs the long-lived workflow that takes a form field from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as communityBadgeApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as customersCustomerQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as experimentsExposureReportingServiceApi from "../../../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as formsFormApprovalServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as formsFormFieldWorkflowServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_workflow_service.js";
import * as formsFormSubmissionCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as formsFormValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as identityUserValidationServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as onboardingOnboardingPlanQueryServiceApi from "../../../../../.cache/proto/acme/onboarding/v1/onboarding_plan_query_service.js";
import * as patientsPatientQueryServiceApi from "../../../../../.cache/proto/acme/patients/v1/patient_query_service.js";
import * as ticketingTicketServiceApi from "../../../../../.cache/proto/acme/ticketing/v1/ticket_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
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
import { toFormFieldRecord } from "../../data/records.js";
import { FormsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form field operations and persist audit data.
 */
@injectable()
export class FormFieldWorkflowWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureReportingService") private readonly experimentsExposureReportingClient: experimentsExposureReportingServiceApi.ExposureReportingServiceClient,
    @inject("grpc:acme.forms.v1.FormApprovalService") private readonly formsFormApprovalClient: formsFormApprovalServiceApi.FormApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionCalculationService") private readonly formsFormSubmissionCalculationClient: formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.onboarding.v1.OnboardingPlanQueryService") private readonly onboardingOnboardingPlanQueryClient: onboardingOnboardingPlanQueryServiceApi.OnboardingPlanQueryServiceClient,
    @inject("grpc:acme.patients.v1.PatientQueryService") private readonly patientsPatientQueryClient: patientsPatientQueryServiceApi.PatientQueryServiceClient,
    @inject("grpc:acme.ticketing.v1.TicketService") private readonly ticketingTicketClient: ticketingTicketServiceApi.TicketServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a form field.
   */
  async advanceFormFieldWorkflow(req: formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowRequest): Promise<formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "AdvanceFormFieldWorkflow", req);
    this.logger.info("advance_form_field_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExposureReportingServiceApi.GenerateExposureReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((req?.formField?.action?.$case === "block" ? req?.formField?.action.block : undefined)?.reason ?? ""),
    });
    const invoke1: Unary<experimentsExposureReportingServiceApi.GenerateExposureReportRequest, experimentsExposureReportingServiceApi.GenerateExposureReportResponse> =
      (input, done) => this.experimentsExposureReportingClient.generateExposureReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExposureReportingServiceApi.GenerateExposureReportResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = ticketingTicketServiceApi.UpdateTicketRequest.fromPartial({
      context: req?.context,
      ticket: {
        audit: {
          createdBy: (req?.formField?.audit?.createdBy ?? ""),
          etag: (req?.formField?.audit?.etag ?? ""),
        },
        counterparty: { displayName: (req?.formField?.owner?.displayName ?? "") },
        lines: [{
          tax: {
            amount: (req?.formField?.action?.$case === "discount" ? req?.formField?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const invoke2: Unary<ticketingTicketServiceApi.UpdateTicketRequest, ticketingTicketServiceApi.UpdateTicketResponse> =
      (input, done) => this.ticketingTicketClient.updateTicket(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowResponse.fromPartial({
        formField: { audit: { etag: (reply2?.ticket?.audit?.etag ?? "") } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      formsFormFieldWorkflowServiceApi.AdvanceFormFieldWorkflowResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          status: req?.formField?.status,
        },
      }),
    );
  }

  /**
   * Cancels a form field.
   */
  async cancelFormFieldWorkflow(req: formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowRequest): Promise<formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "CancelFormFieldWorkflow", req);
    this.logger.info("cancel_form_field_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.formField?.conditions ?? []).map(async (item) => {
      const request1 = customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest.fromPartial({
        context: req?.context,
        customerSegment: { conditions: [{ negate: (item?.negate ?? false) }] },
      });
      const invoke1: Unary<customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse> =
        (input, done) => this.customersCustomerSegmentCalculationClient.quoteCustomerSegment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentRequest, customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? customersCustomerSegmentCalculationServiceApi.QuoteCustomerSegmentResponse.fromPartial({});
    let selected2_3: string | undefined;
    switch (reply1?.customerSegment?.action?.$case) {
      case "block":
        selected2_3 = ((reply1?.customerSegment?.action?.$case === "block" ? reply1?.customerSegment?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        subject: {
          displayName: (reply1?.customerSegment?.owner?.displayName ?? ""),
          formFieldId: (req?.formField?.formFieldId ?? ""),
        },
      },
      reason: (selected2_3 ?? ""),
    });
    const invoke2: Unary<formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionCalculationClient.estimateFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.EstimateFormSubmissionResponse>(invoke2, request2);
    const request3 = communityBadgeApprovalServiceApi.RejectBadgeRequest.fromPartial({
      badge: {
        audit: { updatedAt: req?.formField?.audit?.updatedAt },
        action: { $case: "route", route: {
          target: ((req?.formField?.action?.$case === "route" ? req?.formField?.action.route : undefined)?.target ?? ""),
        } },
      },
      context: req?.context,
      details: { approver: { userId: (reply1?.customerSegment?.owner?.userId ?? "") } },
    });
    const method3 = "rejectBadge" as const;
    const invoke3: Unary<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowResponse.fromPartial({ outcome: { status: (reply3?.outcome?.status ?? "") } }),
      formsFormFieldWorkflowServiceApi.CancelFormFieldWorkflowResponse.fromPartial({
        formField: {
          description: (req?.formField?.description ?? ""),
          formFieldId: (req?.formFieldId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a form field.
   */
  async inspectFormFieldWorkflow(req: formsFormFieldWorkflowServiceApi.InspectFormFieldWorkflowRequest): Promise<formsFormFieldWorkflowServiceApi.InspectFormFieldWorkflowResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectFormFieldWorkflow", req);
    this.logger.info("inspect_form_field_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerQueryServiceApi.BrowseCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.formFieldId ?? ""),
      },
    });
    const proxy1 = forwarding(this.customersCustomerQueryClient);
    const invoke1: Unary<customersCustomerQueryServiceApi.BrowseCustomersRequest, customersCustomerQueryServiceApi.BrowseCustomersResponse> =
      (input, done) => proxy1.browseCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerQueryServiceApi.BrowseCustomersRequest, customersCustomerQueryServiceApi.BrowseCustomersResponse>(invoke1, request1);
    return mergeResponses(
      formsFormFieldWorkflowServiceApi.InspectFormFieldWorkflowResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      formsFormFieldWorkflowServiceApi.InspectFormFieldWorkflowResponse.fromPartial({ formField: { formFieldId: (req?.formFieldId ?? "") } }),
    );
  }

  /**
   * Lists form fields a page at a time.
   */
  async listFormFieldWorkflows(req: formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsRequest): Promise<formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListFormFieldWorkflows", req);
    this.logger.info("list_form_field_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerQueryServiceApi.BrowseCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.filter?.createdAfter,
        labels: Object.fromEntries(Object.entries((req?.filter?.labels ?? {}))),
        region: (req?.filter?.region ?? ""),
      },
    });
    const invoke1: Unary<customersCustomerQueryServiceApi.BrowseCustomersRequest, customersCustomerQueryServiceApi.BrowseCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.browseCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerQueryServiceApi.BrowseCustomersRequest, customersCustomerQueryServiceApi.BrowseCustomersResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return formsFormFieldWorkflowServiceApi.ListFormFieldWorkflowsResponse.fromPartial({
      result: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        status: (reply1?.result?.status ?? ""),
      },
    });
  }

  /**
   * Retrys a form field.
   */
  async retryFormFieldWorkflow(req: formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowRequest): Promise<formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "RetryFormFieldWorkflow", req);
    this.logger.info("retry_form_field_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersHouseholdValidationServiceApi.ExplainHouseholdDecisionRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: {
              etag: (req?.formField?.audit?.etag ?? ""),
              updatedBy: (req?.formField?.audit?.updatedBy ?? ""),
            },
            manager: { userId: (req?.formField?.owner?.userId ?? "") },
          }],
        }],
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<customersHouseholdValidationServiceApi.ExplainHouseholdDecisionRequest, customersHouseholdValidationServiceApi.ExplainHouseholdDecisionResponse> =
      (input, done) => this.customersHouseholdValidationClient.explainHouseholdDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersHouseholdValidationServiceApi.ExplainHouseholdDecisionRequest, customersHouseholdValidationServiceApi.ExplainHouseholdDecisionResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = auditAuditEventValidationServiceApi.NormalizeAuditEventRequest.fromPartial({
      auditEvent: {
        subject: { displayName: (reply1?.household?.manager?.displayName ?? "") },
      },
      context: input2?.context,
      details: {
        contact: {
          email: (reply1?.household?.manager?.email ?? ""),
          preferredChannel: (input2?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<auditAuditEventValidationServiceApi.NormalizeAuditEventRequest, auditAuditEventValidationServiceApi.NormalizeAuditEventResponse> =
      (input, done) => this.auditAuditEventValidationClient.normalizeAuditEvent(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<auditAuditEventValidationServiceApi.NormalizeAuditEventRequest, auditAuditEventValidationServiceApi.NormalizeAuditEventResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowResponse.fromPartial({
        formField: { name: (reply1?.household?.name ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          parameters: (req?.formField?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Signals a form field.
   */
  async signalFormFieldWorkflow(req: formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowRequest): Promise<formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "SignalFormFieldWorkflow", req);
    this.logger.info("signal_form_field_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormApprovalServiceApi.RejectFormRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.formField?.owner?.email ?? "") } },
      form: { audit: { etag: (req?.formField?.audit?.etag ?? "") } },
    });
    const cloned1: formsFormApprovalServiceApi.RejectFormRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<formsFormApprovalServiceApi.RejectFormRequest, formsFormApprovalServiceApi.RejectFormResponse> =
      (input, done) => this.formsFormApprovalClient.rejectForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormApprovalServiceApi.RejectFormRequest, formsFormApprovalServiceApi.RejectFormResponse>(invoke1, cloned1);
    const request2 = patientsPatientQueryServiceApi.FindPatientsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.form?.billingAddress?.region ?? "") },
    });
    const decoded2 = patientsPatientQueryServiceApi.FindPatientsRequest.fromJSON(
      JSON.parse(JSON.stringify(patientsPatientQueryServiceApi.FindPatientsRequest.toJSON(request2))),
    );
    const invoke2: Unary<patientsPatientQueryServiceApi.FindPatientsRequest, patientsPatientQueryServiceApi.FindPatientsResponse> =
      (input, done) => this.patientsPatientQueryClient.findPatients(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<patientsPatientQueryServiceApi.FindPatientsRequest, patientsPatientQueryServiceApi.FindPatientsResponse>(invoke2, decoded2);
    const request3 = formsFormValidationServiceApi.PreviewFormRequest.fromPartial({
      context: req?.context,
      details: { contact: { name: req?.details?.notify?.name } },
      form: {
        audit: { updatedBy: (reply1?.form?.audit?.updatedBy ?? "") },
        counterparty: { email: (reply1?.form?.counterparty?.email ?? "") },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.PreviewFormRequest",
      value: Buffer.from(formsFormValidationServiceApi.PreviewFormRequest.encode(request3).finish()),
    });
    const unpacked3 = formsFormValidationServiceApi.PreviewFormRequest.decode(envelope3.value);
    const invoke3: Unary<formsFormValidationServiceApi.PreviewFormRequest, formsFormValidationServiceApi.PreviewFormResponse> =
      (input, done) => this.formsFormValidationClient.previewForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormValidationServiceApi.PreviewFormRequest, formsFormValidationServiceApi.PreviewFormResponse>(invoke3, unpacked3);
    const request4 = formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.formField?.owner?.email ?? "") } },
      formSubmission: { subject: { formFieldId: (req?.formField?.formFieldId ?? "") } },
    });
    const client4 = this.clients.get<formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient>("acme.forms.v1.FormSubmissionValidationService");
    const invoke4: Unary<formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest, formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse> =
      (input, done) => client4.normalizeFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionRequest, formsFormSubmissionValidationServiceApi.NormalizeFormSubmissionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowResponse.fromPartial({
        formField: { audit: { createdBy: (reply1?.form?.audit?.createdBy ?? "") } },
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
      }),
      formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowResponse.fromPartial({
        outcome: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
      formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowResponse.fromPartial({ outcome: { status: (reply4?.result?.status ?? "") } }),
      formsFormFieldWorkflowServiceApi.SignalFormFieldWorkflowResponse.fromPartial({
        formField: {
          effective: req?.formField?.effective,
          formFieldId: (req?.formFieldId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a form field.
   */
  async startFormFieldWorkflow(req: formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowRequest): Promise<formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "StartFormFieldWorkflow", req);
    this.logger.info("start_form_field_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventValidationServiceApi.LintAuditEventsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
    });
    const invoke1: Unary<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse> =
      (input, done) => this.auditAuditEventValidationClient.lintAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<auditAuditEventValidationServiceApi.LintAuditEventsRequest, auditAuditEventValidationServiceApi.LintAuditEventsResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = identityUserValidationServiceApi.CheckUserEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.notify?.phone ?? "") } },
      user: {
        audit: { updatedBy: (req?.formField?.audit?.updatedBy ?? "") },
        relationshipManager: { email: (req?.details?.notify?.email ?? "") },
      },
    });
    const invoke2: Unary<identityUserValidationServiceApi.CheckUserEligibilityRequest, identityUserValidationServiceApi.CheckUserEligibilityResponse> =
      (input, done) => this.identityUserValidationClient.checkUserEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<identityUserValidationServiceApi.CheckUserEligibilityRequest, identityUserValidationServiceApi.CheckUserEligibilityResponse>(invoke2, request2));
    const request3 = notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (reply2?.user?.contact?.email ?? ""),
          name: reply2?.user?.contact?.name,
          phone: (req?.details?.notify?.phone ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke3: Unary<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse> =
      (input, done) => this.notificationsNotificationNotificationClient.subscribeNotificationUpdates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("StartFormFieldWorkflow.SubscribeNotificationUpdates", () => call<notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesRequest, notificationsNotificationNotificationServiceApi.SubscribeNotificationUpdatesResponse>(invoke3, request3));
    const request4 = onboardingOnboardingPlanQueryServiceApi.BrowseOnboardingPlansRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.notification?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (reply3?.notification?.sla?.policyId ?? ""),
        region: (reply2?.user?.primaryAddress?.region ?? ""),
      },
    });
    const invoke4: Unary<onboardingOnboardingPlanQueryServiceApi.BrowseOnboardingPlansRequest, onboardingOnboardingPlanQueryServiceApi.BrowseOnboardingPlansResponse> =
      (input, done) => this.onboardingOnboardingPlanQueryClient.browseOnboardingPlans(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowResponse.fromPartial({
        formField: { owner: { userId: (reply2?.user?.relationshipManager?.userId ?? "") } },
      }),
      formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowResponse.fromPartial({
        formField: { audit: { etag: (reply3?.notification?.audit?.etag ?? "") } },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          details: (reply4?.result?.details ?? {}),
        },
      }),
      formsFormFieldWorkflowServiceApi.StartFormFieldWorkflowResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          status: req?.formField?.status,
        },
      }),
    );
  }
}
