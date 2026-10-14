/**
 * Routes forms through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as customersConsentRecordCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as formsFormApprovalServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as formsFormQueryServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as formsFormSubmissionCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as formsFormValidationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as maintenanceWorkOrderQueryServiceApi from "../../../../../.cache/proto/acme/maintenance/v1/work_order_query_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
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
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form operations and persist audit data.
 */
@injectable()
export class FormApprovalWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormQueryService") private readonly formsFormQueryClient: formsFormQueryServiceApi.FormQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionCalculationService") private readonly formsFormSubmissionCalculationClient: formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.localization.v1.LocaleApprovalService") private readonly localizationLocaleApprovalClient: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderQueryService") private readonly maintenanceWorkOrderQueryClient: maintenanceWorkOrderQueryServiceApi.WorkOrderQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateQueryService") private readonly notificationsNotificationTemplateQueryClient: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileWorkflowService") private readonly personalizationProfileWorkflowClient: personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a form.
   */
  async approveForm(req: formsFormApprovalServiceApi.ApproveFormRequest): Promise<formsFormApprovalServiceApi.ApproveFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "ApproveForm", req);
    this.logger.info("approve_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormQueryServiceApi.SummarizeFormsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      formId: (req?.form?.formId ?? ""),
    });
    const client1 = this.clients.get<formsFormQueryServiceApi.FormQueryServiceClient>("acme.forms.v1.FormQueryService");
    const invoke1: Unary<formsFormQueryServiceApi.SummarizeFormsRequest, formsFormQueryServiceApi.SummarizeFormsResponse> =
      (input, done) => client1.summarizeForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormQueryServiceApi.SummarizeFormsRequest, formsFormQueryServiceApi.SummarizeFormsResponse>(invoke1, request1);
    const request2 = notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.form?.audit?.updatedAt,
        region: (req?.form?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.countNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormApprovalServiceApi.ApproveFormResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      formsFormApprovalServiceApi.ApproveFormResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      formsFormApprovalServiceApi.ApproveFormResponse.fromPartial({
        form: {
          counterparty: req?.form?.counterparty,
          formId: (req?.formId ?? ""),
        },
      }),
    );
  }

  /**
   * Comments a form.
   */
  async commentFormApproval(req: formsFormApprovalServiceApi.CommentFormApprovalRequest): Promise<formsFormApprovalServiceApi.CommentFormApprovalResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "CommentFormApproval", req);
    this.logger.info("comment_form_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.form?.audit?.createdAt,
        region: (req?.form?.billingAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse> =
      (input, done) => this.notificationsNotificationTemplateQueryClient.browseNotificationTemplates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.BrowseNotificationTemplatesResponse>(invoke1, request1));
    const results2 = await Promise.all((req?.form?.attachments ?? []).map(async (item) => {
      const request2 = formsFormValidationServiceApi.ScoreFormRequest.fromPartial({
        context: req?.context,
        form: { attachments: [{ checksum: (item?.checksum ?? "") }] },
      });
      const invoke2: Unary<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse> =
        (input, done) => this.formsFormValidationClient.scoreForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<formsFormValidationServiceApi.ScoreFormRequest, formsFormValidationServiceApi.ScoreFormResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? formsFormValidationServiceApi.ScoreFormResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormApprovalServiceApi.CommentFormApprovalResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      formsFormApprovalServiceApi.CommentFormApprovalResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          issuedAt: req?.form?.issuedAt,
        },
      }),
    );
  }

  /**
   * Delegates a form.
   */
  async delegateFormApproval(req: formsFormApprovalServiceApi.DelegateFormApprovalRequest): Promise<formsFormApprovalServiceApi.DelegateFormApprovalResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "DelegateFormApproval", req);
    this.logger.info("delegate_form_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest.fromPartial({
      consentRecord: {
        subject: { displayName: (req?.form?.counterparty?.displayName ?? "") },
      },
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
    });
    const invoke1: Unary<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.validateConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("DelegateFormApproval.ValidateConsentRecord", () => call<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse>(invoke1, request1));
    const request2 = customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest.fromPartial({
      consentRecord: {
        subject: {
          displayName: (reply1?.consentRecord?.subject?.displayName ?? ""),
          householdId: (reply1?.consentRecord?.subject?.householdId ?? ""),
          path: (reply1?.consentRecord?.subject?.path ?? ""),
        },
      },
      context: req?.context,
      details: {
        destination: { lines: (req?.form?.billingAddress?.lines ?? []).map((value) => value) },
      },
    });
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.EstimateConsentRecordRequest, customersConsentRecordCalculationServiceApi.EstimateConsentRecordResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.estimateConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormApprovalServiceApi.DelegateFormApprovalResponse.fromPartial({ outcome: { message: (reply1?.result?.message ?? "") } }),
      formsFormApprovalServiceApi.DelegateFormApprovalResponse.fromPartial({
        form: { total: reply2?.breakdown?.total },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      formsFormApprovalServiceApi.DelegateFormApprovalResponse.fromPartial({
        form: {
          counterparty: req?.form?.counterparty,
          formId: (req?.formId ?? ""),
        },
      }),
    );
  }

  /**
   * Escalates a form.
   */
  async escalateForm(req: formsFormApprovalServiceApi.EscalateFormRequest): Promise<formsFormApprovalServiceApi.EscalateFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "EscalateForm", req);
    this.logger.info("escalate_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerCalculationServiceApi.SimulateCustomerRequest.fromPartial({
      context: req?.context,
      customer: {
        primaryAddress: {
          locality: (req?.form?.billingAddress?.locality ?? ""),
          recipient: (req?.form?.billingAddress?.recipient ?? ""),
        },
      },
      details: {
        destination: {
          postalCode: (req?.form?.billingAddress?.postalCode ?? ""),
          region: (req?.form?.billingAddress?.region ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse>(
      "acme.forms.v1.FormApprovalService/EscalateForm:0", request1,
    );
    const request2 = notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (reply1?.customer?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.normalizeDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.NormalizeDeliveryAttemptResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormApprovalServiceApi.EscalateFormResponse.fromPartial({
        form: {
          billingAddress: { locality: (reply1?.customer?.primaryAddress?.locality ?? "") },
        },
      }),
      formsFormApprovalServiceApi.EscalateFormResponse.fromPartial({ result: { details: (reply2?.result?.details ?? {}) } }),
      formsFormApprovalServiceApi.EscalateFormResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          number: (req?.form?.number ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a form.
   */
  async getFormApprovalStatus(req: formsFormApprovalServiceApi.GetFormApprovalStatusRequest): Promise<formsFormApprovalServiceApi.GetFormApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.formId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormApprovalStatus", req);
    this.logger.info("get_form_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersPreferenceValidationServiceApi.CheckPreferenceEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      preference: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const invoke1: Unary<customersPreferenceValidationServiceApi.CheckPreferenceEligibilityRequest, customersPreferenceValidationServiceApi.CheckPreferenceEligibilityResponse> =
      (input, done) => this.customersPreferenceValidationClient.checkPreferenceEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<customersPreferenceValidationServiceApi.CheckPreferenceEligibilityResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    return mergeResponses(
      formsFormApprovalServiceApi.GetFormApprovalStatusResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      formsFormApprovalServiceApi.GetFormApprovalStatusResponse.fromPartial({ form: { formId: (req?.formId ?? "") } }),
    );
  }

  /**
   * Lists forms a page at a time.
   */
  async listPendingForms(req: formsFormApprovalServiceApi.ListPendingFormsRequest): Promise<formsFormApprovalServiceApi.ListPendingFormsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingForms", req);
    this.logger.info("list_pending_forms", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return formsFormApprovalServiceApi.ListPendingFormsResponse.fromPartial({});
  }

  /**
   * Recalls a form.
   */
  async recallForm(req: formsFormApprovalServiceApi.RecallFormRequest): Promise<formsFormApprovalServiceApi.RecallFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "RecallForm", req);
    this.logger.info("recall_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.form?.billingAddress?.lines ?? []).map((value) => value) },
      },
    });
    const invoke1: Unary<customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest, customersConsentRecordValidationServiceApi.ScoreConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.scoreConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.consentRecord?.occurredAt,
        labels: Object.fromEntries(Object.entries((req?.form?.metadata ?? {}))),
        ownerId: (req?.form?.counterparty?.customerId ?? ""),
        region: (req?.form?.billingAddress?.region ?? ""),
      },
    });
    const invoke2: Unary<maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersRequest, maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersResponse> =
      (input, done) => this.maintenanceWorkOrderQueryClient.browseWorkOrders(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const settled3 = await Promise.allSettled((req?.form?.lines ?? []).map(async (item) => {
      const request3 = personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest.fromPartial({
        context: req?.context,
        profile: {
          attributes: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          relationshipManager: { userId: (req?.details?.approver?.userId ?? "") },
        },
      });
      const invoke3: Unary<personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse> =
        (input, done) => this.personalizationProfileWorkflowClient.advanceProfileWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest, personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormApprovalServiceApi.RecallFormResponse.fromPartial({
        form: { lines: [{ attributes: (reply1?.consentRecord?.attributes ?? {}) }] },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      formsFormApprovalServiceApi.RecallFormResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      formsFormApprovalServiceApi.RecallFormResponse.fromPartial({
        form: {
          billingAddress: req?.form?.billingAddress,
          formId: (req?.formId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a form.
   */
  async rejectForm(req: formsFormApprovalServiceApi.RejectFormRequest): Promise<formsFormApprovalServiceApi.RejectFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "RejectForm", req);
    this.logger.info("reject_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormQueryServiceApi.LookupFormRequest.fromPartial({
      context: req?.context,
      formId: (req?.form?.formId ?? ""),
    });
    const method1 = "lookupForm" as const;
    const invoke1: Unary<formsFormQueryServiceApi.LookupFormRequest, formsFormQueryServiceApi.LookupFormResponse> =
      (input, done) => this.formsFormQueryClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormQueryServiceApi.LookupFormRequest, formsFormQueryServiceApi.LookupFormResponse>(invoke1, request1);
    const tasks2: Array<() => Promise<notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse>> = [];
    for (const item of (req?.form?.lines ?? [])) {
      tasks2.push(async () => {
        const request2 = notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: reply1?.form?.dueAt,
            labels: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
            ownerId: (item?.lineId ?? ""),
            region: (req?.form?.billingAddress?.region ?? ""),
          },
        });
        const invoke2: Unary<notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsRequest, notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse> =
          (input, done) => this.notificationsNotificationTemplateSyncClient.listNotificationTemplateConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsRequest, notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormApprovalServiceApi.RejectFormResponse.fromPartial({ form: { metadata: (reply1?.form?.metadata ?? {}) } }),
      formsFormApprovalServiceApi.RejectFormResponse.fromPartial({
        form: { formId: (req?.formId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Submits a form.
   */
  async submitForm(req: formsFormApprovalServiceApi.SubmitFormRequest): Promise<formsFormApprovalServiceApi.SubmitFormResponse> {
    validateContext(req.context);
    if (req.form) {
      await this.repository.save(toFormRecord(req.context.tenantId, req.form));
    }
    await this.repository.record(req.context.tenantId, "SubmitForm", req);
    this.logger.info("submit_form", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.form?.counterparty?.email ?? "") } },
    });
    const proxy1 = forwarding(this.formsFormSubmissionCalculationClient);
    const invoke1: Unary<formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationRequest, formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationResponse> =
      (input, done) => proxy1.explainFormSubmissionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationRequest, formsFormSubmissionCalculationServiceApi.ExplainFormSubmissionCalculationResponse>(invoke1, request1);
    const request2 = localizationLocaleApprovalServiceApi.EscalateLocaleRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: { updatedAt: req?.form?.audit?.updatedAt },
        owner: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const invoke2: Unary<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse> =
      (input, done) => this.localizationLocaleApprovalClient.escalateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse>(invoke2, request2);
    const results3 = await Promise.all((req?.form?.lines ?? []).map(async (item) => {
      const request3 = ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest.fromPartial({
        context: req?.context,
        filter: {
          labels: Object.fromEntries(Object.entries((item?.attributes ?? {}))),
          ownerId: (item?.lineId ?? ""),
          region: (req?.form?.billingAddress?.region ?? ""),
        },
      });
      const invoke3: Unary<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse> =
        (input, done) => this.ledgerLedgerAccountQueryClient.suggestLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse>(invoke3, request3);
      return reply3;
    }));
    const reply3 = results3.at(-1) ?? ledgerLedgerAccountQueryServiceApi.SuggestLedgerAccountsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormApprovalServiceApi.SubmitFormResponse.fromPartial({
        form: { lines: [{ attributes: (reply1?.formSubmission?.attributes ?? {}) }] },
        result: { details: (reply1?.result?.details ?? {}) },
      }),
      formsFormApprovalServiceApi.SubmitFormResponse.fromPartial({
        outcome: {
          message: (reply2?.result?.message ?? ""),
          referenceId: (reply2?.outcome?.referenceId ?? ""),
        },
      }),
      formsFormApprovalServiceApi.SubmitFormResponse.fromPartial({
        form: {
          formId: (req?.formId ?? ""),
          notes: (req?.form?.notes ?? ""),
        },
      }),
    );
  }
}
