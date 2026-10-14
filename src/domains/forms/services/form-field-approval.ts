/**
 * Routes form fields through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as auditAuditEventServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as commonMoneyApi from "../../../../.cache/proto/acme/common/v1/money.js";
import * as customersCustomerValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_validation_service.js";
import * as formsFormApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as formsFormFieldApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_approval_service.js";
import * as formsFormFieldLifecycleServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_lifecycle_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as formsFormQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as formsFormSubmissionApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import * as formsFormSubmissionQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as personalizationProfileServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toFormFieldRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form field operations and persist audit data.
 */
@injectable()
export class FormFieldApprovalWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.customers.v1.CustomerValidationService") private readonly customersCustomerValidationClient: customersCustomerValidationServiceApi.CustomerValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormApprovalService") private readonly formsFormApprovalClient: formsFormApprovalServiceApi.FormApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldLifecycleService") private readonly formsFormFieldLifecycleClient: formsFormFieldLifecycleServiceApi.FormFieldLifecycleServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormQueryService") private readonly formsFormQueryClient: formsFormQueryServiceApi.FormQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionApprovalService") private readonly formsFormSubmissionApprovalClient: formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionQueryService") private readonly formsFormSubmissionQueryClient: formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleWorkflowService") private readonly localizationLocaleWorkflowClient: localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("grpc:acme.webhooks.v1.WebhookEndpointWorkflowService") private readonly webhooksWebhookEndpointWorkflowClient: webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a form field.
   */
  async approveFormField(req: formsFormFieldApprovalServiceApi.ApproveFormFieldRequest): Promise<formsFormFieldApprovalServiceApi.ApproveFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "ApproveFormField", req);
    this.logger.info("approve_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest.fromPartial({
      context: req?.context,
      customer: {
        relationshipManager: { displayName: (req?.formField?.owner?.displayName ?? "") },
      },
    });
    const proxy1 = forwarding(this.customersCustomerValidationClient);
    const invoke1: Unary<customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest, customersCustomerValidationServiceApi.ExplainCustomerDecisionResponse> =
      (input, done) => proxy1.explainCustomerDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerValidationServiceApi.ExplainCustomerDecisionRequest, customersCustomerValidationServiceApi.ExplainCustomerDecisionResponse>(invoke1, request1);
    let selected2_1: commonMoneyApi.Money | undefined;
    switch (req?.formField?.action?.$case) {
      case "discount":
        selected2_1 = (req?.formField?.action?.$case === "discount" ? req?.formField?.action.discount : undefined)?.amount;
        break;
      default:
        selected2_1 = undefined;
    }
    const request2 = formsFormFieldValidationServiceApi.NormalizeFormFieldRequest.fromPartial({
      context: req?.context,
      formField: { action: { $case: "discount", discount: { amount: selected2_1 } } },
    });
    const invoke2: Unary<formsFormFieldValidationServiceApi.NormalizeFormFieldRequest, formsFormFieldValidationServiceApi.NormalizeFormFieldResponse> =
      (input, done) => this.formsFormFieldValidationClient.normalizeFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormFieldValidationServiceApi.NormalizeFormFieldRequest, formsFormFieldValidationServiceApi.NormalizeFormFieldResponse>(invoke2, request2);
    const request3 = formsFormFieldLifecycleServiceApi.ReinstateFormFieldRequest.fromPartial({
      context: req?.context,
      details: {
        newOwner: { userId: (reply2?.formField?.owner?.userId ?? "") },
        notifyContact: { email: (reply1?.customer?.relationshipManager?.email ?? "") },
      },
      formFieldId: (req?.formField?.formFieldId ?? ""),
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<formsFormFieldLifecycleServiceApi.ReinstateFormFieldRequest, formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse> =
      (input, done) => this.formsFormFieldLifecycleClient.reinstateFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormFieldLifecycleServiceApi.ReinstateFormFieldRequest, formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldApprovalServiceApi.ApproveFormFieldResponse.fromPartial({ outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") } }),
      formsFormFieldApprovalServiceApi.ApproveFormFieldResponse.fromPartial({
        formField: { status: reply2?.formField?.status },
        outcome: { referenceId: (reply2?.outcome?.referenceId ?? "") },
      }),
      formsFormFieldApprovalServiceApi.ApproveFormFieldResponse.fromPartial({
        formField: {
          owner: reply3?.formField?.owner,
          status: reply3?.formField?.status,
        },
      }),
      formsFormFieldApprovalServiceApi.ApproveFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          name: (req?.formField?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a form field.
   */
  async commentFormFieldApproval(req: formsFormFieldApprovalServiceApi.CommentFormFieldApprovalRequest): Promise<formsFormFieldApprovalServiceApi.CommentFormFieldApprovalResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "CommentFormFieldApproval", req);
    this.logger.info("comment_form_field_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = auditAuditEventServiceApi.BatchGetAuditEventsRequest.fromPartial({ context: input1?.context });
    const invoke1: Unary<auditAuditEventServiceApi.BatchGetAuditEventsRequest, auditAuditEventServiceApi.BatchGetAuditEventsResponse> =
      (input, done) => this.auditAuditEventClient.batchGetAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventServiceApi.BatchGetAuditEventsRequest, auditAuditEventServiceApi.BatchGetAuditEventsResponse>(invoke1, request1);
    const request2 = webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest.fromPartial({
      context: req?.context,
      webhookEndpoint: {
        owner: {
          displayName: (req?.formField?.owner?.displayName ?? ""),
          email: (req?.formField?.owner?.email ?? ""),
          userId: (req?.details?.approver?.userId ?? ""),
        },
      },
    });
    const cloned2: webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse> =
      (input, done) => this.webhooksWebhookEndpointWorkflowClient.resumeWebhookEndpointWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.ResumeWebhookEndpointWorkflowResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldApprovalServiceApi.CommentFormFieldApprovalResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      formsFormFieldApprovalServiceApi.CommentFormFieldApprovalResponse.fromPartial({
        outcome: {
          referenceId: (reply2?.outcome?.referenceId ?? ""),
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      formsFormFieldApprovalServiceApi.CommentFormFieldApprovalResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          parameters: (req?.formField?.parameters ?? {}),
        },
      }),
    );
  }

  /**
   * Delegates a form field.
   */
  async delegateFormFieldApproval(req: formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest): Promise<formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "DelegateFormFieldApproval", req);
    this.logger.info("delegate_form_field_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormApprovalServiceApi.EscalateFormRequest.fromPartial({
      context: req?.context,
      form: {
        audit: { createdAt: req?.formField?.audit?.createdAt },
        lines: [{
          tax: {
            amount: (req?.formField?.action?.$case === "discount" ? req?.formField?.action.discount : undefined)?.amount,
          },
        }],
      },
    });
    const decoded1 = formsFormApprovalServiceApi.EscalateFormRequest.fromJSON(
      JSON.parse(JSON.stringify(formsFormApprovalServiceApi.EscalateFormRequest.toJSON(request1))),
    );
    const invoke1: Unary<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse> =
      (input, done) => this.formsFormApprovalClient.escalateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse>(invoke1, decoded1);
    const request2 = formsFormApprovalServiceApi.ListPendingFormsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.details?.effectiveAt,
        region: (reply1?.form?.billingAddress?.region ?? ""),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.ListPendingFormsRequest",
      value: Buffer.from(formsFormApprovalServiceApi.ListPendingFormsRequest.encode(request2).finish()),
    });
    const unpacked2 = formsFormApprovalServiceApi.ListPendingFormsRequest.decode(envelope2.value);
    const invoke2: Unary<formsFormApprovalServiceApi.ListPendingFormsRequest, formsFormApprovalServiceApi.ListPendingFormsResponse> =
      (input, done) => this.formsFormApprovalClient.listPendingForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormApprovalServiceApi.ListPendingFormsRequest, formsFormApprovalServiceApi.ListPendingFormsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse.fromPartial({
        formField: { audit: { etag: (reply1?.form?.audit?.etag ?? "") } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse.fromPartial({
        result: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          name: (req?.formField?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a form field.
   */
  async escalateFormField(req: formsFormFieldApprovalServiceApi.EscalateFormFieldRequest): Promise<formsFormFieldApprovalServiceApi.EscalateFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "EscalateFormField", req);
    this.logger.info("escalate_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.formField?.owner?.userId ?? "") } },
    });
    const client1 = this.clients.get<formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceClient>("acme.forms.v1.FormSubmissionApprovalService");
    const invoke1: Unary<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse> =
      (input, done) => client1.recallFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionApprovalServiceApi.RecallFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.RecallFormSubmissionResponse>(invoke1, request1);
    const request2 = localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest.fromPartial({
      context: req?.context,
      locale: {
        owner: { displayName: (reply1?.formSubmission?.subject?.displayName ?? "") },
        action: { $case: "route", route: {
          weight: ((req?.formField?.action?.$case === "route" ? req?.formField?.action.route : undefined)?.weight ?? 0),
        } },
      },
    });
    const invoke2: Unary<localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse> =
      (input, done) => this.localizationLocaleWorkflowClient.startLocaleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldApprovalServiceApi.EscalateFormFieldResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      formsFormFieldApprovalServiceApi.EscalateFormFieldResponse.fromPartial({
        formField: { owner: { userId: (reply2?.locale?.owner?.userId ?? "") } },
      }),
      formsFormFieldApprovalServiceApi.EscalateFormFieldResponse.fromPartial({
        formField: {
          effective: req?.formField?.effective,
          formFieldId: (req?.formFieldId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists form fields a page at a time.
   */
  async listPendingFormFields(req: formsFormFieldApprovalServiceApi.ListPendingFormFieldsRequest): Promise<formsFormFieldApprovalServiceApi.ListPendingFormFieldsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingFormFields", req);
    this.logger.info("list_pending_form_fields", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileServiceApi.BatchCreateProfilesRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.context?.actor?.userId ?? ""),
        submittedBy: { email: (req?.context?.actor?.email ?? "") },
      } },
    });
    const reply1 = await upload<personalizationProfileServiceApi.BatchCreateProfilesRequest, personalizationProfileServiceApi.BatchCreateProfilesResponse>(
      (done) => this.personalizationProfileClient.batchCreateProfiles(metadataFor(request1.context), { deadline: Date.now() + 15_000 }, done), [request1],
    );
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return formsFormFieldApprovalServiceApi.ListPendingFormFieldsResponse.fromPartial({});
  }

  /**
   * Rejects a form field.
   */
  async rejectFormField(req: formsFormFieldApprovalServiceApi.RejectFormFieldRequest): Promise<formsFormFieldApprovalServiceApi.RejectFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "RejectFormField", req);
    this.logger.info("reject_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormQueryServiceApi.SummarizeFormsRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<formsFormQueryServiceApi.SummarizeFormsRequest, formsFormQueryServiceApi.SummarizeFormsResponse> =
      (input, done) => this.formsFormQueryClient.summarizeForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<formsFormQueryServiceApi.SummarizeFormsRequest, formsFormQueryServiceApi.SummarizeFormsResponse>(invoke1, request1));
    const request2 = formsFormSubmissionQueryServiceApi.CountFormSubmissionsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.formField?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
        ownerId: (req?.details?.approver?.userId ?? ""),
      },
    });
    const invoke2: Unary<formsFormSubmissionQueryServiceApi.CountFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.CountFormSubmissionsResponse> =
      (input, done) => this.formsFormSubmissionQueryClient.countFormSubmissions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("RejectFormField.CountFormSubmissions", () => call<formsFormSubmissionQueryServiceApi.CountFormSubmissionsRequest, formsFormSubmissionQueryServiceApi.CountFormSubmissionsResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      formsFormFieldApprovalServiceApi.RejectFormFieldResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormFieldApprovalServiceApi.RejectFormFieldResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      formsFormFieldApprovalServiceApi.RejectFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          version: (req?.formField?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Submits a form field.
   */
  async submitFormField(req: formsFormFieldApprovalServiceApi.SubmitFormFieldRequest): Promise<formsFormFieldApprovalServiceApi.SubmitFormFieldResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "SubmitFormField", req);
    this.logger.info("submit_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.approver?.email ?? "") } },
      webhookEndpoint: { audit: { etag: (req?.formField?.audit?.etag ?? "") } },
    });
    const invoke1: Unary<webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.StartWebhookEndpointWorkflowResponse> =
      (input, done) => this.webhooksWebhookEndpointWorkflowClient.startWebhookEndpointWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldApprovalServiceApi.SubmitFormFieldResponse.fromPartial({
        formField: {
          audit: { createdBy: (reply1?.webhookEndpoint?.audit?.createdBy ?? "") },
        },
      }),
      formsFormFieldApprovalServiceApi.SubmitFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          status: req?.formField?.status,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for FormFieldApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class FormFieldApprovalHandler {
  constructor(@inject(FormFieldApprovalWorkflow) private readonly workflow: FormFieldApprovalWorkflow) {}

  /**
   * Approves a form field.
   */
  approveFormField = unary<formsFormFieldApprovalServiceApi.ApproveFormFieldRequest, formsFormFieldApprovalServiceApi.ApproveFormFieldResponse>(
    (request) => this.workflow.approveFormField(request),
  );

  /**
   * Comments a form field.
   */
  commentFormFieldApproval = unary<formsFormFieldApprovalServiceApi.CommentFormFieldApprovalRequest, formsFormFieldApprovalServiceApi.CommentFormFieldApprovalResponse>(
    (request) => this.workflow.commentFormFieldApproval(request),
  );

  /**
   * Delegates a form field.
   */
  delegateFormFieldApproval = (call: ServerUnaryCall<formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalRequest, formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse>, done: sendUnaryData<formsFormFieldApprovalServiceApi.DelegateFormFieldApprovalResponse>): void => {
    void this.workflow.delegateFormFieldApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a form field.
   */
  escalateFormField = unary<formsFormFieldApprovalServiceApi.EscalateFormFieldRequest, formsFormFieldApprovalServiceApi.EscalateFormFieldResponse>(
    (request) => this.workflow.escalateFormField(request),
  );

  /**
   * Lists form fields a page at a time.
   */
  listPendingFormFields = unary<formsFormFieldApprovalServiceApi.ListPendingFormFieldsRequest, formsFormFieldApprovalServiceApi.ListPendingFormFieldsResponse>(
    (request) => this.workflow.listPendingFormFields(request),
  );

  /**
   * Rejects a form field.
   */
  rejectFormField = (call: ServerUnaryCall<formsFormFieldApprovalServiceApi.RejectFormFieldRequest, formsFormFieldApprovalServiceApi.RejectFormFieldResponse>, done: sendUnaryData<formsFormFieldApprovalServiceApi.RejectFormFieldResponse>): void => {
    void this.workflow.rejectFormField(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Submits a form field.
   */
  submitFormField = unary<formsFormFieldApprovalServiceApi.SubmitFormFieldRequest, formsFormFieldApprovalServiceApi.SubmitFormFieldResponse>(
    (request) => this.workflow.submitFormField(request),
  );
}

export function implementation(handler: FormFieldApprovalHandler): formsFormFieldApprovalServiceApi.FormFieldApprovalServiceServer {
  return {
    approveFormField: handler.approveFormField,
    commentFormFieldApproval: handler.commentFormFieldApproval,
    delegateFormFieldApproval: handler.delegateFormFieldApproval,
    escalateFormField: handler.escalateFormField,
    listPendingFormFields: handler.listPendingFormFields,
    rejectFormField: handler.rejectFormField,
    submitFormField: handler.submitFormField,
  };
}
