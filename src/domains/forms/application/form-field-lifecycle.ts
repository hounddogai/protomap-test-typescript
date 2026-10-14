/**
 * Moves a form field between the states of its lifecycle. Remote work stays behind typed client ports.
 */

import * as customersConsentRecordCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersPreferenceValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as formsFormFieldLifecycleServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_lifecycle_service.js";
import * as formsFormFieldValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as formsFormQueryServiceApi from "../../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as formsFormSubmissionCalculationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as sellersSellerCalculationServiceApi from "../../../../.cache/proto/acme/sellers/v1/seller_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
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
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toFormFieldRecord } from "../data/records.js";
import { FormsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate form field operations and persist audit data.
 */
@injectable()
export class FormFieldLifecycleWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordCalculationService") private readonly customersConsentRecordCalculationClient: customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceValidationService") private readonly customersPreferenceValidationClient: customersPreferenceValidationServiceApi.PreferenceValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormQueryService") private readonly formsFormQueryClient: formsFormQueryServiceApi.FormQueryServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionCalculationService") private readonly formsFormSubmissionCalculationClient: formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleWorkflowService") private readonly localizationLocaleWorkflowClient: localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionWorkflowService") private readonly notificationsSubscriptionWorkflowClient: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient,
    @inject("grpc:acme.sellers.v1.SellerCalculationService") private readonly sellersSellerCalculationClient: sellersSellerCalculationServiceApi.SellerCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Activates a form field.
   */
  async activateFormField(req: formsFormFieldLifecycleServiceApi.ActivateFormFieldRequest): Promise<formsFormFieldLifecycleServiceApi.ActivateFormFieldResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "ActivateFormField", req);
    this.logger.info("activate_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.CheckFormFieldEligibilityRequest",
      value: Buffer.from(formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest.encode(request1).finish()),
    });
    const unpacked1 = formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest.decode(envelope1.value);
    const invoke1: Unary<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest, formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse> =
      (input, done) => this.formsFormFieldValidationClient.checkFormFieldEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest, formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldLifecycleServiceApi.ActivateFormFieldResponse.fromPartial({
        formField: {
          description: (reply1?.formField?.description ?? ""),
          scopes: (reply1?.formField?.scopes ?? []),
        },
      }),
      formsFormFieldLifecycleServiceApi.ActivateFormFieldResponse.fromPartial({
        formField: { formFieldId: (req?.formFieldId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Expires a form field.
   */
  async expireFormField(req: formsFormFieldLifecycleServiceApi.ExpireFormFieldRequest): Promise<formsFormFieldLifecycleServiceApi.ExpireFormFieldResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "ExpireFormField", req);
    this.logger.info("expire_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        subject: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          formFieldId: (req?.formFieldId ?? ""),
        },
      },
      reason: (req?.reason ?? ""),
    });
    const client1 = this.clients.get<formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient>("acme.forms.v1.FormSubmissionCalculationService");
    const invoke1: Unary<formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse> =
      (input, done) => client1.quoteFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionRequest, formsFormSubmissionCalculationServiceApi.QuoteFormSubmissionResponse>(invoke1, request1);
    const request2 = customersCustomerQueryServiceApi.ResolveCustomersRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<customersCustomerQueryServiceApi.ResolveCustomersRequest, customersCustomerQueryServiceApi.ResolveCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.resolveCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<customersCustomerQueryServiceApi.ResolveCustomersRequest, customersCustomerQueryServiceApi.ResolveCustomersResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest.fromPartial({
      context: req?.context,
      details: {
        notify: {
          email: (req?.details?.newOwner?.email ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      locale: {
        owner: { email: (req?.details?.notifyContact?.email ?? "") },
        version: (reply1?.formSubmission?.subject?.version ?? 0),
      },
    });
    const invoke3: Unary<localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse> =
      (input, done) => this.localizationLocaleWorkflowClient.startLocaleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await retry(() => call<localizationLocaleWorkflowServiceApi.StartLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.StartLocaleWorkflowResponse>(invoke3, request3));
    let selected4_1: string | undefined;
    switch (reply3?.locale?.action?.$case) {
      case "block":
        selected4_1 = ((reply3?.locale?.action?.$case === "block" ? reply3?.locale?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest.fromPartial({
      context: req?.context,
      preference: { action: { $case: "block", block: { reason: (selected4_1 ?? "") } } },
    });
    const invoke4: Unary<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse> =
      (input, done) => this.customersPreferenceValidationClient.explainPreferenceDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.phone ?? "") });
    return mergeResponses(
      formsFormFieldLifecycleServiceApi.ExpireFormFieldResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      formsFormFieldLifecycleServiceApi.ExpireFormFieldResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      formsFormFieldLifecycleServiceApi.ExpireFormFieldResponse.fromPartial({
        formField: { owner: { userId: (reply3?.locale?.owner?.userId ?? "") } },
        outcome: { referenceId: (reply3?.outcome?.referenceId ?? "") },
      }),
      formsFormFieldLifecycleServiceApi.ExpireFormFieldResponse.fromPartial({
        formField: {
          effective: reply4?.preference?.effective,
          name: (reply4?.preference?.name ?? ""),
        },
      }),
      formsFormFieldLifecycleServiceApi.ExpireFormFieldResponse.fromPartial({
        formField: { formFieldId: (req?.formFieldId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Returns a form field.
   */
  async getFormFieldLifecycle(req: formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleRequest): Promise<formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetFormFieldLifecycle", req);
    this.logger.info("get_form_field_lifecycle", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const invoke1: Unary<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse> =
      (input, done) => this.notificationsNotificationTemplateExportClient.scheduleNotificationTemplateExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    return mergeResponses(
      formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      formsFormFieldLifecycleServiceApi.GetFormFieldLifecycleResponse.fromPartial({ formField: { formFieldId: (req?.formFieldId ?? "") } }),
    );
  }

  /**
   * Reinstates a form field.
   */
  async reinstateFormField(req: formsFormFieldLifecycleServiceApi.ReinstateFormFieldRequest): Promise<formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "ReinstateFormField", req);
    this.logger.info("reinstate_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.newOwner?.email ?? ""),
          phone: (req?.details?.notifyContact?.phone ?? ""),
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
      formSubmission: { subject: { formFieldId: (req?.formFieldId ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest, formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse>(
      "acme.forms.v1.FormFieldLifecycleService/ReinstateFormField:0", request1,
    );
    const request2 = notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.details?.notifyContact?.email ?? "") } },
      subscription: {
        owner: {
          displayName: (reply1?.formSubmission?.subject?.displayName ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
      },
    });
    const invoke2: Unary<notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowResponse> =
      (input, done) => this.notificationsSubscriptionWorkflowClient.signalSubscriptionWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowResponse>(invoke2, request2));
    const request3 = customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        action: { $case: "route", route: {
          target: ((reply2?.subscription?.action?.$case === "route" ? reply2?.subscription?.action.route : undefined)?.target ?? ""),
        } },
      },
    });
    const invoke3: Unary<customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsRequest, customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.compareCustomerSegmentOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<customersCustomerSegmentCalculationServiceApi.CompareCustomerSegmentOptionsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse.fromPartial({
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse.fromPartial({
        outcome: { message: (reply2?.outcome?.message ?? "") },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse.fromPartial({
        formField: { description: (reply3?.customerSegment?.description ?? "") },
        result: { correlationId: (reply3?.result?.correlationId ?? "") },
      }),
      formsFormFieldLifecycleServiceApi.ReinstateFormFieldResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          owner: { displayName: (req?.details?.newOwner?.displayName ?? "") },
        },
      }),
    );
  }

  /**
   * Renews a form field.
   */
  async renewFormField(req: formsFormFieldLifecycleServiceApi.RenewFormFieldRequest): Promise<formsFormFieldLifecycleServiceApi.RenewFormFieldResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "RenewFormField", req);
    this.logger.info("renew_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = sellersSellerCalculationServiceApi.ExplainSellerCalculationRequest.fromPartial({
      context: req?.context,
      seller: {
        contact: {
          preferredChannel: (req?.details?.notifyContact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<sellersSellerCalculationServiceApi.ExplainSellerCalculationRequest, sellersSellerCalculationServiceApi.ExplainSellerCalculationResponse> =
      (input, done) => this.sellersSellerCalculationClient.explainSellerCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = formsFormQueryServiceApi.SummarizeFormsRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<formsFormQueryServiceApi.SummarizeFormsRequest, formsFormQueryServiceApi.SummarizeFormsResponse> =
      (input, done) => this.formsFormQueryClient.summarizeForms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = formsFormValidationServiceApi.CheckFormEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (reply1?.seller?.contact?.preferredChannel ?? "") },
      },
      form: {
        audit: { etag: (reply1?.seller?.audit?.etag ?? "") },
        billingAddress: {
          lines: (reply1?.seller?.primaryAddress?.lines ?? []).map((value) => value),
        },
        counterparty: { displayName: (req?.details?.newOwner?.displayName ?? "") },
      },
    });
    const method3 = "checkFormEligibility" as const;
    const invoke3: Unary<formsFormValidationServiceApi.CheckFormEligibilityRequest, formsFormValidationServiceApi.CheckFormEligibilityResponse> =
      (input, done) => this.formsFormValidationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormValidationServiceApi.CheckFormEligibilityRequest, formsFormValidationServiceApi.CheckFormEligibilityResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.notifyContact?.phone ?? "") });
    return mergeResponses(
      formsFormFieldLifecycleServiceApi.RenewFormFieldResponse.fromPartial({ formField: { audit: { createdAt: reply1?.seller?.audit?.createdAt } } }),
      formsFormFieldLifecycleServiceApi.RenewFormFieldResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      formsFormFieldLifecycleServiceApi.RenewFormFieldResponse.fromPartial({
        formField: {
          owner: { displayName: (reply3?.form?.counterparty?.displayName ?? "") },
        },
      }),
      formsFormFieldLifecycleServiceApi.RenewFormFieldResponse.fromPartial({
        formField: { formFieldId: (req?.formFieldId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Schedules a form field.
   */
  async scheduleFormFieldExpiry(req: formsFormFieldLifecycleServiceApi.ScheduleFormFieldExpiryRequest): Promise<formsFormFieldLifecycleServiceApi.ScheduleFormFieldExpiryResponse> {
    validateContext(req.context);
    if (req.formField) {
      await this.repository.save(toFormFieldRecord(req.context.tenantId, req.formField));
    }
    await this.repository.record(req.context.tenantId, "ScheduleFormFieldExpiry", req);
    this.logger.info("schedule_form_field_expiry", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldValidationServiceApi.GetFormFieldRulesRequest.fromPartial({
      context: req?.context,
      formFieldId: (req?.formField?.formFieldId ?? ""),
    });
    const proxy1 = forwarding(this.formsFormFieldValidationClient);
    const invoke1: Unary<formsFormFieldValidationServiceApi.GetFormFieldRulesRequest, formsFormFieldValidationServiceApi.GetFormFieldRulesResponse> =
      (input, done) => proxy1.getFormFieldRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldValidationServiceApi.GetFormFieldRulesRequest, formsFormFieldValidationServiceApi.GetFormFieldRulesResponse>(invoke1, request1);
    let selected2_2: string | undefined;
    switch (reply1?.formField?.action?.$case) {
      case "block":
        selected2_2 = ((reply1?.formField?.action?.$case === "block" ? reply1?.formField?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest.fromPartial({
      consentRecord: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        measurements: [{ observedAt: reply1?.formField?.audit?.createdAt }],
        subject: { displayName: (reply1?.formField?.owner?.displayName ?? "") },
      },
      context: req?.context,
      reason: (selected2_2 ?? ""),
    });
    const invoke2: Unary<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse> =
      (input, done) => this.customersConsentRecordCalculationClient.compareConsentRecordOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsRequest, customersConsentRecordCalculationServiceApi.CompareConsentRecordOptionsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldLifecycleServiceApi.ScheduleFormFieldExpiryResponse.fromPartial({
        formField: {
          audit: { updatedBy: (reply1?.formField?.audit?.updatedBy ?? "") },
          scopes: (reply1?.formField?.scopes ?? []),
        },
      }),
      formsFormFieldLifecycleServiceApi.ScheduleFormFieldExpiryResponse.fromPartial({
        result: { correlationId: (reply2?.consentRecord?.correlationId ?? "") },
      }),
      formsFormFieldLifecycleServiceApi.ScheduleFormFieldExpiryResponse.fromPartial({
        formField: {
          formFieldId: (req?.formFieldId ?? ""),
          owner: req?.formField?.owner,
        },
      }),
    );
  }

  /**
   * Suspends a form field.
   */
  async suspendFormField(req: formsFormFieldLifecycleServiceApi.SuspendFormFieldRequest): Promise<formsFormFieldLifecycleServiceApi.SuspendFormFieldResponse> {
    validateContext(req.context);
    if (!req.formFieldId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_field_id is required");
    }
    await this.repository.record(req.context.tenantId, "SuspendFormField", req);
    this.logger.info("suspend_form_field", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest.fromPartial({
      context: req?.context,
      notification: {
        assignee: {
          displayName: (req?.details?.newOwner?.displayName ?? ""),
          userId: (req?.details?.newOwner?.userId ?? ""),
        },
        requester: { email: (req?.details?.newOwner?.email ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.recalculateNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest.fromPartial({
      context: input2?.context,
      details: { contact: { name: reply1?.notification?.requester?.name } },
      formField: {
        audit: { createdBy: (reply1?.notification?.audit?.createdBy ?? "") },
        owner: {
          displayName: (input2?.details?.newOwner?.displayName ?? ""),
          email: (reply1?.notification?.requester?.email ?? ""),
        },
      },
    });
    const invoke2: Unary<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest, formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse> =
      (input, done) => this.formsFormFieldValidationClient.checkFormFieldEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormFieldValidationServiceApi.CheckFormFieldEligibilityRequest, formsFormFieldValidationServiceApi.CheckFormFieldEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormFieldLifecycleServiceApi.SuspendFormFieldResponse.fromPartial({
        formField: { audit: { createdAt: reply1?.notification?.audit?.createdAt } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      formsFormFieldLifecycleServiceApi.SuspendFormFieldResponse.fromPartial({
        formField: {
          owner: { userId: (reply2?.formField?.owner?.userId ?? "") },
          priority: (reply2?.formField?.priority ?? 0),
        },
      }),
      formsFormFieldLifecycleServiceApi.SuspendFormFieldResponse.fromPartial({
        formField: { formFieldId: (req?.formFieldId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }
}
