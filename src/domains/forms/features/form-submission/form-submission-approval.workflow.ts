/**
 * Routes form submissions through approval, with escalation and delegation. Remote work stays behind typed client
 * ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as experimentsExperimentServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as formsFormApprovalServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as formsFormCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormFieldLifecycleServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_lifecycle_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as formsFormSubmissionApprovalServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import * as formsFormSubmissionLifecycleServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_lifecycle_service.js";
import * as formsFormSubmissionQueryServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import * as fulfillmentFulfillmentServiceApi from "../../../../../.cache/proto/acme/fulfillment/v1/fulfillment_service.js";
import * as performersPerformerQueryServiceApi from "../../../../../.cache/proto/acme/performers/v1/performer_query_service.js";
import * as schedulingShiftQueryServiceApi from "../../../../../.cache/proto/acme/scheduling/v1/shift_query_service.js";
import * as seatingSeatMapCalculationServiceApi from "../../../../../.cache/proto/acme/seating/v1/seat_map_calculation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
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
import { collect, upload } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toFormSubmissionRecord } from "../../data/records.js";
import { FormsRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form submission operations and persist audit data.
 */
@injectable()
export class FormSubmissionApprovalWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeApprovalService") private readonly communityBadgeApprovalClient: communityBadgeApprovalServiceApi.BadgeApprovalServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentService") private readonly experimentsExperimentClient: experimentsExperimentServiceApi.ExperimentServiceClient,
    @inject("grpc:acme.forms.v1.FormApprovalService") private readonly formsFormApprovalClient: formsFormApprovalServiceApi.FormApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldLifecycleService") private readonly formsFormFieldLifecycleClient: formsFormFieldLifecycleServiceApi.FormFieldLifecycleServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionLifecycleService") private readonly formsFormSubmissionLifecycleClient: formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionQueryService") private readonly formsFormSubmissionQueryClient: formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceClient,
    @inject("grpc:acme.fulfillment.v1.FulfillmentService") private readonly fulfillmentFulfillmentClient: fulfillmentFulfillmentServiceApi.FulfillmentServiceClient,
    @inject("grpc:acme.performers.v1.PerformerQueryService") private readonly performersPerformerQueryClient: performersPerformerQueryServiceApi.PerformerQueryServiceClient,
    @inject("grpc:acme.scheduling.v1.ShiftQueryService") private readonly schedulingShiftQueryClient: schedulingShiftQueryServiceApi.ShiftQueryServiceClient,
    @inject("grpc:acme.seating.v1.SeatMapCalculationService") private readonly seatingSeatMapCalculationClient: seatingSeatMapCalculationServiceApi.SeatMapCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a form submission.
   */
  async approveFormSubmission(req: formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionRequest): Promise<formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "ApproveFormSubmission", req);
    this.logger.info("approve_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
      formSubmissionId: (req?.formSubmission?.formSubmissionId ?? ""),
    });
    const proxy1 = forwarding(this.formsFormSubmissionLifecycleClient);
    const invoke1: Unary<formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse> =
      (input, done) => proxy1.activateFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse>(invoke1, request1);
    const request2 = experimentsExperimentServiceApi.BatchCreateExperimentsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.formSubmission?.source ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
      sequence: (req?.formSubmission?.sequence ?? 0),
    });
    const reply2 = await upload<experimentsExperimentServiceApi.BatchCreateExperimentsRequest, experimentsExperimentServiceApi.BatchCreateExperimentsResponse>(
      (done) => this.experimentsExperimentClient.batchCreateExperiments(metadataFor(request2.context), { deadline: Date.now() + 15_000 }, done), [request2],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionResponse.fromPartial({
        formSubmission: {
          attributes: (req?.formSubmission?.attributes ?? {}),
          formSubmissionId: (req?.formSubmissionId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a form submission.
   */
  async commentFormSubmissionApproval(req: formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalRequest): Promise<formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "CommentFormSubmissionApproval", req);
    this.logger.info("comment_form_submission_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldLifecycleServiceApi.SuspendFormFieldRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: {
          displayName: (req?.formSubmission?.subject?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
      formFieldId: (req?.formSubmission?.subject?.formFieldId ?? ""),
    });
    const invoke1: Unary<formsFormFieldLifecycleServiceApi.SuspendFormFieldRequest, formsFormFieldLifecycleServiceApi.SuspendFormFieldResponse> =
      (input, done) => this.formsFormFieldLifecycleClient.suspendFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldLifecycleServiceApi.SuspendFormFieldRequest, formsFormFieldLifecycleServiceApi.SuspendFormFieldResponse>(invoke1, request1);
    const request2 = customersHouseholdQueryServiceApi.ExportHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.formSubmission?.occurredAt,
        ownerId: (reply1?.formField?.owner?.userId ?? ""),
      },
    });
    const stream2 = this.customersHouseholdQueryClient.exportHouseholds(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? customersHouseholdQueryServiceApi.ExportHouseholdsResponse.fromPartial({});
    const request3 = performersPerformerQueryServiceApi.BrowsePerformersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.outcome?.effectiveAt,
        labels: Object.fromEntries(Object.entries((reply1?.formField?.parameters ?? {}))),
        ownerId: (reply1?.formField?.owner?.userId ?? ""),
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<performersPerformerQueryServiceApi.BrowsePerformersRequest, performersPerformerQueryServiceApi.BrowsePerformersResponse> =
      (input, done) => this.performersPerformerQueryClient.browsePerformers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<performersPerformerQueryServiceApi.BrowsePerformersRequest, performersPerformerQueryServiceApi.BrowsePerformersResponse>(invoke3, spread3);
    const { context: context4, ...body4 } = req;
    const input4 = { ...body4, context: context4 };
    const request4 = formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest.fromPartial({
      context: input4?.context,
      details: {
        newOwner: {
          email: (input4?.details?.approver?.email ?? ""),
          userId: (input4?.details?.approver?.userId ?? ""),
        },
      },
      formSubmissionId: (input4?.formSubmission?.formSubmissionId ?? ""),
    });
    const invoke4: Unary<formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionLifecycleClient.activateFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ActivateFormSubmissionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalResponse.fromPartial({
        formSubmission: { correlationId: (reply1?.result?.correlationId ?? "") },
        outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) },
      }),
      formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalResponse.fromPartial({ result: { details: (reply3?.result?.details ?? {}) } }),
      formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { message: (reply4?.outcome?.message ?? "") },
      }),
      formsFormSubmissionApprovalServiceApi.CommentFormSubmissionApprovalResponse.fromPartial({
        formSubmission: {
          attributes: (req?.formSubmission?.attributes ?? {}),
          formSubmissionId: (req?.formSubmissionId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a form submission.
   */
  async delegateFormSubmissionApproval(req: formsFormSubmissionApprovalServiceApi.DelegateFormSubmissionApprovalRequest): Promise<formsFormSubmissionApprovalServiceApi.DelegateFormSubmissionApprovalResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "DelegateFormSubmissionApproval", req);
    this.logger.info("delegate_form_submission_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: {
          displayName: (req?.details?.approver?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      formSubmissionId: (req?.formSubmission?.formSubmissionId ?? ""),
    });
    const cloned1: formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionLifecycleClient.reinstateFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse>(invoke1, cloned1);
    const request2 = formsFormCalculationServiceApi.EstimateFormRequest.fromPartial({
      context: req?.context,
      form: {
        counterparty: {
          displayName: (reply1?.formSubmission?.subject?.displayName ?? ""),
          email: (req?.details?.approver?.email ?? ""),
        },
      },
    });
    const decoded2 = formsFormCalculationServiceApi.EstimateFormRequest.fromJSON(
      JSON.parse(JSON.stringify(formsFormCalculationServiceApi.EstimateFormRequest.toJSON(request2))),
    );
    const invoke2: Unary<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse> =
      (input, done) => this.formsFormCalculationClient.estimateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormCalculationServiceApi.EstimateFormRequest, formsFormCalculationServiceApi.EstimateFormResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionApprovalServiceApi.DelegateFormSubmissionApprovalResponse.fromPartial({
        result: { correlationId: (reply1?.formSubmission?.correlationId ?? "") },
      }),
      formsFormSubmissionApprovalServiceApi.DelegateFormSubmissionApprovalResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      formsFormSubmissionApprovalServiceApi.DelegateFormSubmissionApprovalResponse.fromPartial({
        formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Escalates a form submission.
   */
  async escalateFormSubmission(req: formsFormSubmissionApprovalServiceApi.EscalateFormSubmissionRequest): Promise<formsFormSubmissionApprovalServiceApi.EscalateFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "EscalateFormSubmission", req);
    this.logger.info("escalate_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldValidationServiceApi.LintFormFieldsRequest.fromPartial({
      context: req?.context,
      formField: {
        owner: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.LintFormFieldsRequest",
      value: Buffer.from(formsFormFieldValidationServiceApi.LintFormFieldsRequest.encode(request1).finish()),
    });
    const unpacked1 = formsFormFieldValidationServiceApi.LintFormFieldsRequest.decode(envelope1.value);
    const invoke1: Unary<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse> =
      (input, done) => this.formsFormFieldValidationClient.lintFormFields(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse>(invoke1, unpacked1);
    const request2 = formsFormSubmissionQueryServiceApi.PeekFormSubmissionRequest.fromPartial({
      context: req?.context,
      formSubmissionId: (req?.formSubmissionId ?? ""),
    });
    const client2 = this.clients.get<formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceClient>("acme.forms.v1.FormSubmissionQueryService");
    const invoke2: Unary<formsFormSubmissionQueryServiceApi.PeekFormSubmissionRequest, formsFormSubmissionQueryServiceApi.PeekFormSubmissionResponse> =
      (input, done) => client2.peekFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionQueryServiceApi.PeekFormSubmissionRequest, formsFormSubmissionQueryServiceApi.PeekFormSubmissionResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionApprovalServiceApi.EscalateFormSubmissionResponse.fromPartial({
        outcome: { message: (reply1?.outcome?.message ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      formsFormSubmissionApprovalServiceApi.EscalateFormSubmissionResponse.fromPartial({
        formSubmission: {
          attributes: (reply2?.formSubmission?.attributes ?? {}),
          subject: { formFieldId: (reply2?.formSubmission?.subject?.formFieldId ?? "") },
        },
      }),
      formsFormSubmissionApprovalServiceApi.EscalateFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          kind: (req?.formSubmission?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a form submission.
   */
  async getFormSubmissionApprovalStatus(req: formsFormSubmissionApprovalServiceApi.GetFormSubmissionApprovalStatusRequest): Promise<formsFormSubmissionApprovalServiceApi.GetFormSubmissionApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormSubmissionApprovalStatus", req);
    this.logger.info("get_form_submission_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormApprovalServiceApi.CommentFormApprovalRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      form: {
        issuedAt: req?.context?.deadline,
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        }],
      },
    });
    const invoke1: Unary<formsFormApprovalServiceApi.CommentFormApprovalRequest, formsFormApprovalServiceApi.CommentFormApprovalResponse> =
      (input, done) => this.formsFormApprovalClient.commentFormApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<formsFormApprovalServiceApi.CommentFormApprovalRequest, formsFormApprovalServiceApi.CommentFormApprovalResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    return mergeResponses(
      formsFormSubmissionApprovalServiceApi.GetFormSubmissionApprovalStatusResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.outcome?.status ?? ""),
        },
      }),
      formsFormSubmissionApprovalServiceApi.GetFormSubmissionApprovalStatusResponse.fromPartial({ formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") } }),
    );
  }

  /**
   * Lists form submissions a page at a time.
   */
  async listPendingFormSubmissions(req: formsFormSubmissionApprovalServiceApi.ListPendingFormSubmissionsRequest): Promise<formsFormSubmissionApprovalServiceApi.ListPendingFormSubmissionsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingFormSubmissions", req);
    this.logger.info("list_pending_form_submissions", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return formsFormSubmissionApprovalServiceApi.ListPendingFormSubmissionsResponse.fromPartial({});
  }

  /**
   * Recalls a form submission.
   */
  async recallFormSubmission(req: formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest): Promise<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "RecallFormSubmission", req);
    this.logger.info("recall_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: {
          email: (req?.details?.approver?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
      formSubmissionId: (req?.formSubmissionId ?? ""),
    });
    const invoke1: Unary<formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionLifecycleClient.suspendFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.SuspendFormSubmissionResponse>(invoke1, request1));
    const request2 = formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: {
        effectiveAt: req?.details?.effectiveAt,
        newOwner: {
          displayName: (reply1?.formSubmission?.subject?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
        notifyContact: { email: (req?.details?.approver?.email ?? "") },
      },
      formSubmissionId: (req?.formSubmissionId ?? ""),
    });
    const invoke2: Unary<formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionLifecycleClient.terminateFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("RecallFormSubmission.TerminateFormSubmission", () => call<formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.TerminateFormSubmissionResponse>(invoke2, request2));
    const request3 = customersPreferenceValidationServiceApi.PreviewPreferenceRequest.fromPartial({
      context: req?.context,
      preference: {
        owner: { displayName: (reply1?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const invoke3: Unary<customersPreferenceValidationServiceApi.PreviewPreferenceRequest, customersPreferenceValidationServiceApi.PreviewPreferenceResponse> =
      (input, done) => this.customersPreferenceValidationClient.previewPreference(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = schedulingShiftQueryServiceApi.BrowseShiftsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply3?.preference?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.formSubmission?.attributes ?? {}))),
        ownerId: (req?.formSubmission?.subject?.formFieldId ?? ""),
      },
    });
    const reply4 = await this.workQueue.enqueue<schedulingShiftQueryServiceApi.BrowseShiftsRequest, schedulingShiftQueryServiceApi.BrowseShiftsResponse>(
      "acme.forms.v1.FormSubmissionApprovalService/RecallFormSubmission:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse.fromPartial({
        result: {
          correlationId: (reply4?.result?.correlationId ?? ""),
          details: (reply4?.result?.details ?? {}),
        },
      }),
      formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          subject: req?.formSubmission?.subject,
        },
      }),
    );
  }

  /**
   * Rejects a form submission.
   */
  async rejectFormSubmission(req: formsFormSubmissionApprovalServiceApi.RejectFormSubmissionRequest): Promise<formsFormSubmissionApprovalServiceApi.RejectFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "RejectFormSubmission", req);
    this.logger.info("reject_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeApprovalServiceApi.RejectBadgeRequest.fromPartial({
      context: req?.context,
      details: {
        approver: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const invoke1: Unary<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse> =
      (input, done) => this.communityBadgeApprovalClient.rejectBadge(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse>(invoke1, request1));
    const tasks2: Array<() => Promise<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse>> = [];
    for (const item of (req?.formSubmission?.measurements ?? [])) {
      tasks2.push(async () => {
        const request2 = formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest.fromPartial({
          context: req?.context,
          formField: {
            audit: {
              createdAt: item?.observedAt,
              createdBy: (reply1?.badge?.audit?.createdBy ?? ""),
            },
            action: { $case: "block", block: {
              reason: ((reply1?.badge?.action?.$case === "block" ? reply1?.badge?.action.block : undefined)?.reason ?? ""),
            } },
            owner: { userId: (reply1?.badge?.owner?.userId ?? "") },
          },
        });
        const invoke2: Unary<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest, formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse> =
          (input, done) => this.formsFormFieldValidationClient.checkFormFieldEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest, formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionApprovalServiceApi.RejectFormSubmissionResponse.fromPartial({ outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") } }),
      formsFormSubmissionApprovalServiceApi.RejectFormSubmissionResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          source: (req?.formSubmission?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a form submission.
   */
  async submitFormSubmission(req: formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionRequest): Promise<formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "SubmitFormSubmission", req);
    this.logger.info("submit_form_submission", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fulfillmentFulfillmentServiceApi.BatchGetFulfillmentsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<fulfillmentFulfillmentServiceApi.BatchGetFulfillmentsRequest, fulfillmentFulfillmentServiceApi.BatchGetFulfillmentsResponse> =
      (input, done) => this.fulfillmentFulfillmentClient.batchGetFulfillments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<fulfillmentFulfillmentServiceApi.BatchGetFulfillmentsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = seatingSeatMapCalculationServiceApi.QuoteSeatMapRequest.fromPartial({
      context: req?.context,
      seatMap: {
        children: [{
          children: [{ manager: { email: (req?.details?.approver?.email ?? "") } }],
        }],
      },
    });
    const invoke2: Unary<seatingSeatMapCalculationServiceApi.QuoteSeatMapRequest, seatingSeatMapCalculationServiceApi.QuoteSeatMapResponse> =
      (input, done) => this.seatingSeatMapCalculationClient.quoteSeatMap(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest.fromPartial({
      badge: { audit: { updatedAt: reply2?.seatMap?.audit?.updatedAt } },
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.formSubmission?.subject?.displayName ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
    });
    const invoke3: Unary<communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest, communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse> =
      (input, done) => this.communityBadgeApprovalClient.delegateBadgeApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionResponse.fromPartial({
        formSubmission: { correlationId: (reply3?.result?.correlationId ?? "") },
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
      }),
      formsFormSubmissionApprovalServiceApi.SubmitFormSubmissionResponse.fromPartial({
        formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") },
        result: { correlationId: (req?.formSubmission?.correlationId ?? "") },
      }),
    );
  }
}
