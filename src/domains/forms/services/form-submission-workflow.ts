/**
 * Runs the long-lived workflow that takes a form submission from start to finish. Remote work stays behind typed
 * client ports.
 */

import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerQueryServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as formsFormApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as formsFormSubmissionApprovalServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_approval_service.js";
import * as formsFormSubmissionLifecycleServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_lifecycle_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as formsFormValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as formsFormWorkflowServiceApi from "../../../../.cache/proto/acme/forms/v1/form_workflow_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsNotificationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../platform/rpc.js";
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
export class FormSubmissionWorkflowWorkflow {
  constructor(
    @inject(FormsRepository) private readonly repository: FormsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerQueryService") private readonly customersCustomerQueryClient: customersCustomerQueryServiceApi.CustomerQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentWorkflowService") private readonly experimentsExperimentWorkflowClient: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient,
    @inject("grpc:acme.forms.v1.FormApprovalService") private readonly formsFormApprovalClient: formsFormApprovalServiceApi.FormApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionApprovalService") private readonly formsFormSubmissionApprovalClient: formsFormSubmissionApprovalServiceApi.FormSubmissionApprovalServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionLifecycleService") private readonly formsFormSubmissionLifecycleClient: formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient,
    @inject("grpc:acme.forms.v1.FormSubmissionValidationService") private readonly formsFormSubmissionValidationClient: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormValidationService") private readonly formsFormValidationClient: formsFormValidationServiceApi.FormValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormWorkflowService") private readonly formsFormWorkflowClient: formsFormWorkflowServiceApi.FormWorkflowServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationService") private readonly notificationsNotificationClient: notificationsNotificationServiceApi.NotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionSyncService") private readonly notificationsSubscriptionSyncClient: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a form submission.
   */
  async advanceFormSubmissionWorkflow(req: formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowRequest): Promise<formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "AdvanceFormSubmissionWorkflow", req);
    this.logger.info("advance_form_submission_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormValidationServiceApi.ExplainFormDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.notify?.email ?? "") } },
      form: {
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.formSubmission?.attributes ?? {}))),
        }],
      },
    });
    const reply1 = await this.workQueue.enqueue<formsFormValidationServiceApi.ExplainFormDecisionRequest, formsFormValidationServiceApi.ExplainFormDecisionResponse>(
      "acme.forms.v1.FormSubmissionWorkflowService/AdvanceFormSubmissionWorkflow:0", request1,
    );
    let selected2_2: string | undefined;
    switch (reply1?.form?.settlement?.$case) {
      case "card":
        selected2_2 = ((reply1?.form?.settlement?.$case === "card" ? reply1?.form?.settlement.card : undefined)?.network ?? "");
        break;
      default:
        selected2_2 = "";
    }
    const request2 = ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        funding: { $case: "card", card: { network: (selected2_2 ?? "") } },
        holder: { displayName: (req?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.createLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: {
          subject: { displayName: (reply1?.form?.counterparty?.displayName ?? "") },
        },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          sequence: (req?.formSubmission?.sequence ?? 0),
        },
      }),
    );
  }

  /**
   * Cancels a form submission.
   */
  async cancelFormSubmissionWorkflow(req: formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest): Promise<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "CancelFormSubmissionWorkflow", req);
    this.logger.info("cancel_form_submission_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { name: req?.details?.notify?.name } },
      experiment: {
        organizer: { email: (req?.details?.notify?.email ?? "") },
        participants: [{ contact: { phone: (req?.details?.notify?.phone ?? "") } }],
      },
    });
    const invoke1: Unary<experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowResponse> =
      (input, done) => this.experimentsExperimentWorkflowClient.pauseExperimentWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<experimentsExperimentWorkflowServiceApi.PauseExperimentWorkflowResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = notificationsNotificationServiceApi.BatchGetNotificationsRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<notificationsNotificationServiceApi.BatchGetNotificationsRequest, notificationsNotificationServiceApi.BatchGetNotificationsResponse> =
      (input, done) => this.notificationsNotificationClient.batchGetNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = formsFormApprovalServiceApi.EscalateFormRequest.fromPartial({
      context: req?.context,
      details: {
        approver: {
          displayName: (req?.formSubmission?.subject?.displayName ?? ""),
          userId: (reply1?.experiment?.organizer?.userId ?? ""),
        },
      },
      form: {
        billingAddress: {
          lines: (reply1?.experiment?.location?.lines ?? []).map((value) => value),
          region: (reply1?.experiment?.location?.region ?? ""),
        },
      },
    });
    const invoke3: Unary<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse> =
      (input, done) => this.formsFormApprovalClient.escalateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse.fromPartial({
        outcome: { status: (reply3?.result?.status ?? "") },
        result: { details: (reply3?.result?.details ?? {}) },
      }),
      formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: {
          attributes: (req?.formSubmission?.attributes ?? {}),
          formSubmissionId: (req?.formSubmissionId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a form submission.
   */
  async inspectFormSubmissionWorkflow(req: formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowRequest): Promise<formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowResponse> {
    validateContext(req.context);
    if (!req.formSubmissionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "form_submission_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectFormSubmissionWorkflow", req);
    this.logger.info("inspect_form_submission_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        ownerId: (req?.formSubmissionId ?? ""),
      },
    });
    const method1 = "listAffinityConflicts" as const;
    const invoke1: Unary<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse> =
      (input, done) => this.personalizationAffinitySyncClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse>(invoke1, request1);
    const request2 = notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        action: { $case: "block", block: { notifyEmail: (req?.context?.actor?.email ?? "") } },
        parameters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        scopes: (req?.context?.actor?.roles ?? []).map((value) => value),
      } },
      context: req?.context,
    });
    const stream2 = this.notificationsSubscriptionSyncClient.streamSubscriptionChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? notificationsSubscriptionSyncServiceApi.StreamSubscriptionChangesResponse.fromPartial({});
    return mergeResponses(
      formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowResponse.fromPartial({ formSubmission: { formSubmissionId: (req?.formSubmissionId ?? "") } }),
    );
  }

  /**
   * Pauses a form submission.
   */
  async pauseFormSubmissionWorkflow(req: formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowRequest): Promise<formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "PauseFormSubmissionWorkflow", req);
    this.logger.info("pause_form_submission_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest.fromPartial({
      consentRecord: {
        attributes: Object.fromEntries(Object.entries((req?.formSubmission?.attributes ?? {}))),
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.details?.notify?.name,
        },
      },
    });
    const proxy1 = forwarding(this.customersConsentRecordValidationClient);
    const invoke1: Unary<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse> =
      (input, done) => proxy1.validateConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse>(invoke1, request1);
    const request2 = customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest.fromPartial({
      consentRecord: {
        subject: { householdId: (reply1?.consentRecord?.subject?.householdId ?? "") },
      },
      context: req?.context,
    });
    const invoke2: Unary<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.previewConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersConsentRecordValidationServiceApi.PreviewConsentRecordRequest, customersConsentRecordValidationServiceApi.PreviewConsentRecordResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: {
          subject: { displayName: (reply1?.consentRecord?.subject?.displayName ?? "") },
        },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowResponse.fromPartial({
        outcome: { nextSteps: (reply2?.outcome?.nextSteps ?? []) },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          occurredAt: req?.formSubmission?.occurredAt,
        },
      }),
    );
  }

  /**
   * Retrys a form submission.
   */
  async retryFormSubmissionWorkflow(req: formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowRequest): Promise<formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "RetryFormSubmissionWorkflow", req);
    this.logger.info("retry_form_submission_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.details?.notify?.email ?? "") } },
      formSubmission: {
        subject: {
          displayName: (req?.formSubmission?.subject?.displayName ?? ""),
          formFieldId: (req?.formSubmission?.subject?.formFieldId ?? ""),
        },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionApprovalClient.approveFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionRequest, formsFormSubmissionApprovalServiceApi.ApproveFormSubmissionResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptRequest.fromPartial({
      context: input2?.context,
      deliveryAttempt: {
        attributes: Object.fromEntries(Object.entries((input2?.formSubmission?.attributes ?? {}))),
        correlationId: (input2?.formSubmission?.correlationId ?? ""),
        occurredAt: reply1?.formSubmission?.occurredAt,
        subject: { displayName: (input2?.formSubmission?.subject?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.scoreDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.ScoreDeliveryAttemptResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply2?.deliveryAttempt?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          source: (req?.formSubmission?.source ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a form submission.
   */
  async signalFormSubmissionWorkflow(req: formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest): Promise<formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "SignalFormSubmissionWorkflow", req);
    this.logger.info("signal_form_submission_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormWorkflowServiceApi.CancelFormWorkflowRequest.fromPartial({
      context: req?.context,
      form: { counterparty: { email: (req?.details?.notify?.email ?? "") } },
    });
    const cloned1: formsFormWorkflowServiceApi.CancelFormWorkflowRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<formsFormWorkflowServiceApi.CancelFormWorkflowRequest, formsFormWorkflowServiceApi.CancelFormWorkflowResponse> =
      (input, done) => this.formsFormWorkflowClient.cancelFormWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormWorkflowServiceApi.CancelFormWorkflowRequest, formsFormWorkflowServiceApi.CancelFormWorkflowResponse>(invoke1, cloned1);
    const request2 = customersCustomerQueryServiceApi.CountCustomersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.form?.audit?.updatedAt,
        ownerId: (reply1?.form?.counterparty?.customerId ?? ""),
        region: (reply1?.form?.billingAddress?.region ?? ""),
      },
    });
    const decoded2 = customersCustomerQueryServiceApi.CountCustomersRequest.fromJSON(
      JSON.parse(JSON.stringify(customersCustomerQueryServiceApi.CountCustomersRequest.toJSON(request2))),
    );
    const invoke2: Unary<customersCustomerQueryServiceApi.CountCustomersRequest, customersCustomerQueryServiceApi.CountCustomersResponse> =
      (input, done) => this.customersCustomerQueryClient.countCustomers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersCustomerQueryServiceApi.CountCustomersRequest, customersCustomerQueryServiceApi.CountCustomersResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: {
          formSubmissionId: (req?.formSubmissionId ?? ""),
          kind: (req?.formSubmission?.kind ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a form submission.
   */
  async startFormSubmissionWorkflow(req: formsFormSubmissionWorkflowServiceApi.StartFormSubmissionWorkflowRequest): Promise<formsFormSubmissionWorkflowServiceApi.StartFormSubmissionWorkflowResponse> {
    validateContext(req.context);
    if (req.formSubmission) {
      await this.repository.save(toFormSubmissionRecord(req.context.tenantId, req.formSubmission));
    }
    await this.repository.record(req.context.tenantId, "StartFormSubmissionWorkflow", req);
    this.logger.info("start_form_submission_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest.fromPartial({
      context: req?.context,
      formSubmission: {
        source: (req?.formSubmission?.source ?? ""),
        subject: {
          displayName: (req?.formSubmission?.subject?.displayName ?? ""),
          formFieldId: (req?.formSubmission?.subject?.formFieldId ?? ""),
        },
      },
      formSubmissionId: (req?.formSubmission?.formSubmissionId ?? ""),
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.forms.v1.ScoreFormSubmissionRequest",
      value: Buffer.from(formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest.encode(request1).finish()),
    });
    const unpacked1 = formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest.decode(envelope1.value);
    const invoke1: Unary<formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest, formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse> =
      (input, done) => this.formsFormSubmissionValidationClient.scoreFormSubmission(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormSubmissionValidationServiceApi.ScoreFormSubmissionRequest, formsFormSubmissionValidationServiceApi.ScoreFormSubmissionResponse>(invoke1, unpacked1);
    const request2 = formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleRequest.fromPartial({
      context: req?.context,
      formSubmissionId: (req?.formSubmission?.formSubmissionId ?? ""),
    });
    const client2 = this.clients.get<formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient>("acme.forms.v1.FormSubmissionLifecycleService");
    const invoke2: Unary<formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleRequest, formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleResponse> =
      (input, done) => client2.getFormSubmissionLifecycle(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleRequest, formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      formsFormSubmissionWorkflowServiceApi.StartFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: { formSubmissionId: (reply1?.formSubmission?.formSubmissionId ?? "") },
        outcome: { message: (reply1?.result?.message ?? "") },
      }),
      formsFormSubmissionWorkflowServiceApi.StartFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: { formSubmissionId: (reply2?.formSubmission?.formSubmissionId ?? "") },
        result: { status: (reply2?.result?.status ?? "") },
      }),
      formsFormSubmissionWorkflowServiceApi.StartFormSubmissionWorkflowResponse.fromPartial({
        formSubmission: { sequence: (req?.formSubmission?.sequence ?? 0) },
        result: { correlationId: (req?.formSubmission?.correlationId ?? "") },
      }),
    );
  }
}

/**
 * The gRPC boundary for FormSubmissionWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class FormSubmissionWorkflowHandler {
  constructor(@inject(FormSubmissionWorkflowWorkflow) private readonly workflow: FormSubmissionWorkflowWorkflow) {}

  /**
   * Advances a form submission.
   */
  advanceFormSubmissionWorkflow = unary<formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.AdvanceFormSubmissionWorkflowResponse>(
    (request) => this.workflow.advanceFormSubmissionWorkflow(request),
  );

  /**
   * Cancels a form submission.
   */
  cancelFormSubmissionWorkflow = unary<formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.CancelFormSubmissionWorkflowResponse>(
    (request) => this.workflow.cancelFormSubmissionWorkflow(request),
  );

  /**
   * Returns a form submission.
   */
  inspectFormSubmissionWorkflow = (call: ServerUnaryCall<formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowResponse>, done: sendUnaryData<formsFormSubmissionWorkflowServiceApi.InspectFormSubmissionWorkflowResponse>): void => {
    void this.workflow.inspectFormSubmissionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a form submission.
   */
  pauseFormSubmissionWorkflow = unary<formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.PauseFormSubmissionWorkflowResponse>(
    (request) => this.workflow.pauseFormSubmissionWorkflow(request),
  );

  /**
   * Retrys a form submission.
   */
  retryFormSubmissionWorkflow = unary<formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.RetryFormSubmissionWorkflowResponse>(
    (request) => this.workflow.retryFormSubmissionWorkflow(request),
  );

  /**
   * Signals a form submission.
   */
  signalFormSubmissionWorkflow = (call: ServerUnaryCall<formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse>, done: sendUnaryData<formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse>): void => {
    void this.workflow.signalFormSubmissionWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Starts a form submission.
   */
  startFormSubmissionWorkflow = unary<formsFormSubmissionWorkflowServiceApi.StartFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.StartFormSubmissionWorkflowResponse>(
    (request) => this.workflow.startFormSubmissionWorkflow(request),
  );
}

export function implementation(handler: FormSubmissionWorkflowHandler): formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceServer {
  return {
    advanceFormSubmissionWorkflow: handler.advanceFormSubmissionWorkflow,
    cancelFormSubmissionWorkflow: handler.cancelFormSubmissionWorkflow,
    inspectFormSubmissionWorkflow: handler.inspectFormSubmissionWorkflow,
    pauseFormSubmissionWorkflow: handler.pauseFormSubmissionWorkflow,
    retryFormSubmissionWorkflow: handler.retryFormSubmissionWorkflow,
    signalFormSubmissionWorkflow: handler.signalFormSubmissionWorkflow,
    startFormSubmissionWorkflow: handler.startFormSubmissionWorkflow,
  };
}
