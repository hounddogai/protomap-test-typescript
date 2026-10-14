import * as billingBillingAccountQueryServiceApi from "../../../.cache/proto/acme/billing/v1/billing_account_query_service.js";
import * as boxofficeBoxOfficeSaleCalculationServiceApi from "../../../.cache/proto/acme/boxoffice/v1/box_office_sale_calculation_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as messagingChannelApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushBoxOfficeSaleCalculationMessage keeps of each ExplainBoxOfficeSaleCalculation response. */
interface PushBoxOfficeSaleCalculationMessageRecord {
  message: string;
  referenceId: string;
}

/** Where pushBoxOfficeSaleCalculationMessage hands each record. */
interface PushBoxOfficeSaleCalculationMessageTarget {
  send(record: PushBoxOfficeSaleCalculationMessageRecord): Promise<void>;
}

/** Writes records to acme.messaging.v1.ChannelApprovalService. */
class PushBoxOfficeSaleCalculationMessageChannelApproval implements PushBoxOfficeSaleCalculationMessageTarget {
  private readonly client: messagingChannelApprovalServiceApi.ChannelApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChannelApprovalServiceApi.ChannelApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushBoxOfficeSaleCalculationMessageRecord): Promise<void> {
    await call<messagingChannelApprovalServiceApi.GetChannelApprovalStatusRequest, messagingChannelApprovalServiceApi.GetChannelApprovalStatusResponse>(
      (request, done) => this.client.getChannelApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingChannelApprovalServiceApi.GetChannelApprovalStatusRequest.fromPartial({ channelId: record.referenceId }));
  }
}

/** Sends records to acme.forms.v1.FormSubmissionValidationService. */
class PushBoxOfficeSaleCalculationMessageFormSubmissionValidation implements PushBoxOfficeSaleCalculationMessageTarget {
  private readonly client: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushBoxOfficeSaleCalculationMessageRecord): Promise<void> {
    await call<formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest, formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse>(
      (request, done) => this.client.lintFormSubmissions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest.fromPartial({ formSubmission: { kind: record.message } }));
  }
}

/** Writes records to acme.billing.v1.BillingAccountQueryService. */
class PushBoxOfficeSaleCalculationMessageBillingAccountQuery implements PushBoxOfficeSaleCalculationMessageTarget {
  private readonly client: billingBillingAccountQueryServiceApi.BillingAccountQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new billingBillingAccountQueryServiceApi.BillingAccountQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PushBoxOfficeSaleCalculationMessageRecord): Promise<void> {
    await call<billingBillingAccountQueryServiceApi.CountBillingAccountsRequest, billingBillingAccountQueryServiceApi.CountBillingAccountsResponse>(
      (request, done) => this.client.countBillingAccounts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      billingBillingAccountQueryServiceApi.CountBillingAccountsRequest.fromPartial({ filter: { region: record.referenceId, ownerId: record.message } }));
  }
}

/**
 * Reads acme.boxoffice.v1.BoxOfficeSaleCalculationService/ExplainBoxOfficeSaleCalculation and hands what it
 * keeps to the sink of its kind.
 */
export async function pushBoxOfficeSaleCalculationMessage(runtime: Runtime): Promise<void> {
  const source = new boxofficeBoxOfficeSaleCalculationServiceApi.BoxOfficeSaleCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<boxofficeBoxOfficeSaleCalculationServiceApi.ExplainBoxOfficeSaleCalculationRequest, boxofficeBoxOfficeSaleCalculationServiceApi.ExplainBoxOfficeSaleCalculationResponse>(
    (request, done) => source.explainBoxOfficeSaleCalculation(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    boxofficeBoxOfficeSaleCalculationServiceApi.ExplainBoxOfficeSaleCalculationRequest.fromPartial({ reason: "nightly-push-box-office-sale-calculation-message" })));
  const kept: PushBoxOfficeSaleCalculationMessageRecord = {
    message: found.outcome?.message ?? "",
    referenceId: found.outcome?.referenceId ?? "",
  };
  const entries: Array<{ kind: string; sink: PushBoxOfficeSaleCalculationMessageTarget }> = [
    { kind: "channel-approval", sink: new PushBoxOfficeSaleCalculationMessageChannelApproval(runtime) },
    { kind: "form-submission-validation", sink: new PushBoxOfficeSaleCalculationMessageFormSubmissionValidation(runtime) },
    { kind: "billing-account-query", sink: new PushBoxOfficeSaleCalculationMessageBillingAccountQuery(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "form-submission-validation") continue;
    await entry.sink.send(kept);
  }
}
