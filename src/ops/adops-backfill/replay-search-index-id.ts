import * as bankingBankAccountServiceApi from "../../../.cache/proto/acme/banking/v1/bank_account_service.js";
import * as formsFormSubmissionWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_workflow_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as searchSearchIndexServiceApi from "../../../.cache/proto/acme/search/v1/search_index_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replaySearchIndexId keeps of each DeleteSearchIndex response. */
interface ReplaySearchIndexIdRecord {
  correlationId: string;
  status: string;
}

/** Where replaySearchIndexId hands each record. */
interface ReplaySearchIndexIdTarget {
  push(record: ReplaySearchIndexIdRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.DeliveryAttemptHistoryService. */
class ReplaySearchIndexIdDeliveryAttemptHistory implements ReplaySearchIndexIdTarget {
  private readonly client: notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplaySearchIndexIdRecord): Promise<void> {
    await call<notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsRequest, notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsResponse>(
      (request, done) => this.client.pruneDeliveryAttemptVersions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsDeliveryAttemptHistoryServiceApi.PruneDeliveryAttemptVersionsRequest.fromPartial({ etag: record.status }));
  }
}

/** Sends records to acme.banking.v1.BankAccountService. */
class ReplaySearchIndexIdBankAccount implements ReplaySearchIndexIdTarget {
  private readonly client: bankingBankAccountServiceApi.BankAccountServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new bankingBankAccountServiceApi.BankAccountServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplaySearchIndexIdRecord): Promise<void> {
    await call<bankingBankAccountServiceApi.CloneBankAccountRequest, bankingBankAccountServiceApi.CloneBankAccountResponse>(
      (request, done) => this.client.cloneBankAccount(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      bankingBankAccountServiceApi.CloneBankAccountRequest.fromPartial({ bankAccount: { currencyCode: record.correlationId }, requestId: record.status }));
  }
}

/** Passes records to acme.personalization.v1.ProfileLifecycleService. */
class ReplaySearchIndexIdProfileLifecycle implements ReplaySearchIndexIdTarget {
  private readonly client: personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplaySearchIndexIdRecord): Promise<void> {
    await call<personalizationProfileLifecycleServiceApi.TerminateProfileRequest, personalizationProfileLifecycleServiceApi.TerminateProfileResponse>(
      (request, done) => this.client.terminateProfile(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationProfileLifecycleServiceApi.TerminateProfileRequest.fromPartial({ profileId: record.correlationId }));
  }
}

/** Passes records to acme.forms.v1.FormSubmissionWorkflowService. */
class ReplaySearchIndexIdFormSubmissionWorkflow implements ReplaySearchIndexIdTarget {
  private readonly client: formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionWorkflowServiceApi.FormSubmissionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplaySearchIndexIdRecord): Promise<void> {
    await call<formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest, formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowResponse>(
      (request, done) => this.client.signalFormSubmissionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      formsFormSubmissionWorkflowServiceApi.SignalFormSubmissionWorkflowRequest.fromPartial({ details: { step: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ReplaySearchIndexIdLogOnly implements ReplaySearchIndexIdTarget {
  async push(record: ReplaySearchIndexIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverReplaySearchIndexId(kind: string, record: ReplaySearchIndexIdRecord, runtime: Runtime): Promise<void> {
  let sink: ReplaySearchIndexIdTarget = new ReplaySearchIndexIdLogOnly();
  switch (kind) {
    case "delivery-attempt-history":
      sink = new ReplaySearchIndexIdDeliveryAttemptHistory(runtime);
      break;
    case "bank-account":
      sink = new ReplaySearchIndexIdBankAccount(runtime);
      break;
    case "profile-lifecycle":
      sink = new ReplaySearchIndexIdProfileLifecycle(runtime);
      break;
    case "form-submission-workflow":
      sink = new ReplaySearchIndexIdFormSubmissionWorkflow(runtime);
      break;
  }
  await sink.push(record);
}

/** Reads acme.search.v1.SearchIndexService/DeleteSearchIndex and hands what it keeps to the sink of its kind. */
export async function replaySearchIndexId(runtime: Runtime): Promise<void> {
  const upstream = new searchSearchIndexServiceApi.SearchIndexServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<searchSearchIndexServiceApi.DeleteSearchIndexRequest, searchSearchIndexServiceApi.DeleteSearchIndexResponse>(
    (request, done) => upstream.deleteSearchIndex(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    searchSearchIndexServiceApi.DeleteSearchIndexRequest.fromPartial({ searchIndexId: "live-replay-search-index-id" })));
  const row: ReplaySearchIndexIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    status: response.result?.status ?? "",
  };
  await deliverReplaySearchIndexId("form-submission-workflow", row, runtime);
}
