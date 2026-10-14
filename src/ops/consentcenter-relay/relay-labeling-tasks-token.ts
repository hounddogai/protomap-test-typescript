import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as invoicingInvoiceBatchCalculationServiceApi from "../../../.cache/proto/acme/invoicing/v1/invoice_batch_calculation_service.js";
import * as labelingLabelingTaskServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as surveysSurveyResponseValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayLabelingTasksToken keeps of each ListLabelingTasks response. */
interface RelayLabelingTasksTokenRecord {
  nextPageToken: string;
  correlationId: string;
  message: string;
  status: string;
}

/** Where relayLabelingTasksToken hands each record. */
interface RelayLabelingTasksTokenTarget {
  apply(record: RelayLabelingTasksTokenRecord): Promise<void>;
}

/** Hands records to acme.surveys.v1.SurveyResponseValidationService. */
class RelayLabelingTasksTokenSurveyResponseValidation implements RelayLabelingTasksTokenTarget {
  private readonly client: surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyResponseValidationServiceApi.SurveyResponseValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayLabelingTasksTokenRecord): Promise<void> {
    await retry(() => call<surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesRequest, surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesResponse>(
      (request, done) => this.client.getSurveyResponseRules(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysSurveyResponseValidationServiceApi.GetSurveyResponseRulesRequest.fromPartial({ surveyResponseId: record.correlationId })));
  }
}

/** Hands records to acme.community.v1.ForumApprovalService. */
class RelayLabelingTasksTokenForumApproval implements RelayLabelingTasksTokenTarget {
  private readonly client: communityForumApprovalServiceApi.ForumApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumApprovalServiceApi.ForumApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayLabelingTasksTokenRecord): Promise<void> {
    await retry(() => call<communityForumApprovalServiceApi.DelegateForumApprovalRequest, communityForumApprovalServiceApi.DelegateForumApprovalResponse>(
      (request, done) => this.client.delegateForumApproval(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityForumApprovalServiceApi.DelegateForumApprovalRequest.fromPartial({ forum: { forumId: record.nextPageToken, name: record.message } })));
  }
}

/** Hands records to acme.notifications.v1.NotificationTemplateExportService. */
class RelayLabelingTasksTokenNotificationTemplateExport implements RelayLabelingTasksTokenTarget {
  private readonly client: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayLabelingTasksTokenRecord): Promise<void> {
    await retry(() => call<notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportResponse>(
      (request, done) => this.client.retryNotificationTemplateExport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsNotificationTemplateExportServiceApi.RetryNotificationTemplateExportRequest.fromPartial({ details: { step: record.status } })));
  }
}

/** Sends records to acme.invoicing.v1.InvoiceBatchCalculationService. */
class RelayLabelingTasksTokenInvoiceBatchCalculation implements RelayLabelingTasksTokenTarget {
  private readonly client: invoicingInvoiceBatchCalculationServiceApi.InvoiceBatchCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new invoicingInvoiceBatchCalculationServiceApi.InvoiceBatchCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RelayLabelingTasksTokenRecord): Promise<void> {
    await call<invoicingInvoiceBatchCalculationServiceApi.CompareInvoiceBatchOptionsRequest, invoicingInvoiceBatchCalculationServiceApi.CompareInvoiceBatchOptionsResponse>(
      (request, done) => this.client.compareInvoiceBatchOptions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      invoicingInvoiceBatchCalculationServiceApi.CompareInvoiceBatchOptionsRequest.fromPartial({ reason: record.correlationId }));
  }
}

/** Reads acme.labeling.v1.LabelingTaskService/ListLabelingTasks and hands what it keeps to the sink of its kind. */
export async function relayLabelingTasksToken(runtime: Runtime): Promise<void> {
  const reader = new labelingLabelingTaskServiceApi.LabelingTaskServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<labelingLabelingTaskServiceApi.ListLabelingTasksRequest, labelingLabelingTaskServiceApi.ListLabelingTasksResponse>(
    (request, done) => reader.listLabelingTasks(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    labelingLabelingTaskServiceApi.ListLabelingTasksRequest.fromPartial({ orderBy: "nightly-relay-labeling-tasks-token" })));
  const entry: RelayLabelingTasksTokenRecord = {
    nextPageToken: reply.pageInfo?.nextPageToken ?? "",
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
    message: reply.result?.message ?? "",
    status: reply.result?.status ?? "",
  };
  const sinks = new Map<string, RelayLabelingTasksTokenTarget>([
    ["survey-response-validation", new RelayLabelingTasksTokenSurveyResponseValidation(runtime)],
    ["forum-approval", new RelayLabelingTasksTokenForumApproval(runtime)],
    ["notification-template-export", new RelayLabelingTasksTokenNotificationTemplateExport(runtime)],
    ["invoice-batch-calculation", new RelayLabelingTasksTokenInvoiceBatchCalculation(runtime)],
  ]);
  const sink = sinks.get(process.env["RELAY_LABELING_TASKS_TOKEN_TARGET"] ?? "");
  if (!sink) return;
  await sink.apply(entry);
}
