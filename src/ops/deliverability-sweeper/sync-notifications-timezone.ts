import * as bankingBankAccountQueryServiceApi from "../../../.cache/proto/acme/banking/v1/bank_account_query_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncNotificationsTimezone keeps of each SummarizeNotifications response. */
interface SyncNotificationsTimezoneRecord {
  timezone: string;
  reportId: string;
  status: string;
  message: string;
}

/** Where syncNotificationsTimezone hands each record. */
interface SyncNotificationsTimezoneTarget {
  forward(record: SyncNotificationsTimezoneRecord): Promise<void>;
}

/** Writes records to acme.banking.v1.BankAccountQueryService. */
class SyncNotificationsTimezoneBankAccountQuery implements SyncNotificationsTimezoneTarget {
  private readonly client: bankingBankAccountQueryServiceApi.BankAccountQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new bankingBankAccountQueryServiceApi.BankAccountQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncNotificationsTimezoneRecord): Promise<void> {
    await call<bankingBankAccountQueryServiceApi.SuggestBankAccountsRequest, bankingBankAccountQueryServiceApi.SuggestBankAccountsResponse>(
      (request, done) => this.client.suggestBankAccounts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      bankingBankAccountQueryServiceApi.SuggestBankAccountsRequest.fromPartial({ filter: { query: record.reportId } }));
  }
}

/** Writes records to acme.surveys.v1.SurveyWorkflowService. */
class SyncNotificationsTimezoneSurveyWorkflow implements SyncNotificationsTimezoneTarget {
  private readonly client: surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncNotificationsTimezoneRecord): Promise<void> {
    await call<surveysSurveyWorkflowServiceApi.StartSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.StartSurveyWorkflowResponse>(
      (request, done) => this.client.startSurveyWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      surveysSurveyWorkflowServiceApi.StartSurveyWorkflowRequest.fromPartial({ survey: { number: record.message } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class SyncNotificationsTimezoneLogOnly implements SyncNotificationsTimezoneTarget {
  async forward(record: SyncNotificationsTimezoneRecord): Promise<void> {
    console.info("no sink for record", record.timezone);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverSyncNotificationsTimezone(kind: string, record: SyncNotificationsTimezoneRecord, runtime: Runtime): Promise<void> {
  let sink: SyncNotificationsTimezoneTarget = new SyncNotificationsTimezoneLogOnly();
  switch (kind) {
    case "bank-account-query":
      sink = new SyncNotificationsTimezoneBankAccountQuery(runtime);
      break;
    case "survey-workflow":
      sink = new SyncNotificationsTimezoneSurveyWorkflow(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.notifications.v1.NotificationQueryService/SummarizeNotifications and hands what it keeps to the
 * sink of its kind.
 */
export async function syncNotificationsTimezone(runtime: Runtime): Promise<void> {
  const source = new notificationsNotificationQueryServiceApi.NotificationQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest, notificationsNotificationQueryServiceApi.SummarizeNotificationsResponse>(
    (request, done) => source.summarizeNotifications(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    notificationsNotificationQueryServiceApi.SummarizeNotificationsRequest.fromPartial({ reason: "current-sync-notifications-timezone" }));
  const record: SyncNotificationsTimezoneRecord = {
    timezone: current.period?.timezone ?? "",
    reportId: current.reportId,
    status: text.normalize(current.result?.status ?? ""),
    message: current.result?.message ?? "",
  };
  await deliverSyncNotificationsTimezone("bank-account-query", record, runtime);
}
