import * as chatHandoffCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportQuestionWorkflowId keeps of each InspectQuestionWorkflow response. */
interface ExportQuestionWorkflowIdRecord {
  questionId: string;
  description: string;
  name: string;
}

/** Where exportQuestionWorkflowId hands each record. */
interface ExportQuestionWorkflowIdDestination {
  push(record: ExportQuestionWorkflowIdRecord): Promise<void>;
}

/** Sends records to acme.chat.v1.HandoffCalculationService. */
class ExportQuestionWorkflowIdHandoffCalculation implements ExportQuestionWorkflowIdDestination {
  private readonly client: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffCalculationServiceApi.HandoffCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportQuestionWorkflowIdRecord): Promise<void> {
    await call<chatHandoffCalculationServiceApi.GetHandoffRatesRequest, chatHandoffCalculationServiceApi.GetHandoffRatesResponse>(
      (request, done) => this.client.getHandoffRates(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatHandoffCalculationServiceApi.GetHandoffRatesRequest.fromPartial({ handoffId: record.name }));
  }
}

/** Passes records to acme.notifications.v1.NotificationHistoryService. */
class ExportQuestionWorkflowIdNotificationHistory implements ExportQuestionWorkflowIdDestination {
  private readonly client: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ExportQuestionWorkflowIdRecord): Promise<void> {
    await call<notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.ListNotificationVersionsResponse>(
      (request, done) => this.client.listNotificationVersions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsNotificationHistoryServiceApi.ListNotificationVersionsRequest.fromPartial({ filter: { query: record.name, ownerId: record.description } }));
  }
}

/**
 * Reads acme.surveys.v1.QuestionWorkflowService/InspectQuestionWorkflow and hands what it keeps to the sink
 * of its kind.
 */
export async function exportQuestionWorkflowId(runtime: Runtime): Promise<void> {
  const reader = new surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowResponse>(
    (request, done) => reader.inspectQuestionWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowRequest.fromPartial({ questionId: "nightly-export-question-workflow-id" }));
  const record: ExportQuestionWorkflowIdRecord = {
    questionId: current.question?.questionId ?? "",
    description: current.question?.description ?? "",
    name: current.question?.name ?? "",
  };
  const sinks: ExportQuestionWorkflowIdDestination[] = [
    new ExportQuestionWorkflowIdHandoffCalculation(runtime),
    new ExportQuestionWorkflowIdNotificationHistory(runtime),
  ];
  await sinks[0]!.push(record);
}
