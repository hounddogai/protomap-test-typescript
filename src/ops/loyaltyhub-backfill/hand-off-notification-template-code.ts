import * as notificationsNotificationTemplateCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffNotificationTemplateCode keeps of each EstimateNotificationTemplate response. */
interface HandOffNotificationTemplateCodeRecord {
  currencyCode: string;
  notes: string;
  notificationTemplateId: string;
  message: string;
}

/**
 * Reads acme.notifications.v1.NotificationTemplateCalculationService/EstimateNotificationTemplate, keeps its
 * fields by name, and passes some of them to acme.surveys.v1.QuestionWorkflowService.
 */
export async function handOffNotificationTemplateCode(runtime: Runtime): Promise<void> {
  const origin = new notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateResponse>(
    (request, done) => origin.estimateNotificationTemplate(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    notificationsNotificationTemplateCalculationServiceApi.EstimateNotificationTemplateRequest.fromPartial({ notificationTemplateId: "primary-hand-off-notification-template-code" }));
  const row: HandOffNotificationTemplateCodeRecord = {
    currencyCode: current.breakdown?.currencyCode ?? "",
    notes: current.notificationTemplate?.notes ?? "",
    notificationTemplateId: current.notificationTemplate?.notificationTemplateId ?? "",
    message: current.result?.message ?? "",
  };
  const slots = new Headers();
  slots.set("x-currency-code", row.currencyCode);
  slots.set("x-notes", row.notes);
  slots.set("x-notification-template-id", row.notificationTemplateId);
  slots.set("x-message", row.message);
  const sink = new surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  await call<surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsRequest, surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsResponse>(
    (request, done) => sink.listQuestionWorkflows(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    surveysQuestionWorkflowServiceApi.ListQuestionWorkflowsRequest.fromPartial({ filter: { query: slots.get("x-message") ?? "" } }));
}
