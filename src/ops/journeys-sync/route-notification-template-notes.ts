import * as communityModerationLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeNotificationTemplateNotes keeps of each CalculateNotificationTemplate response. */
interface RouteNotificationTemplateNotesRecord {
  notes: string;
  notificationTemplateId: string;
  currencyCode: string;
  message: string;
}

/**
 * Reads acme.notifications.v1.NotificationTemplateCalculationService/CalculateNotificationTemplate, keeps its
 * fields by name, and passes some of them to acme.community.v1.ModerationLifecycleService.
 */
export async function routeNotificationTemplateNotes(runtime: Runtime): Promise<void> {
  const upstream = new notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateRequest, notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateResponse>(
    (request, done) => upstream.calculateNotificationTemplate(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    notificationsNotificationTemplateCalculationServiceApi.CalculateNotificationTemplateRequest.fromPartial({ notificationTemplateId: "primary-route-notification-template-notes" }));
  const record: RouteNotificationTemplateNotesRecord = {
    notes: current.notificationTemplate?.notes ?? "",
    notificationTemplateId: current.notificationTemplate?.notificationTemplateId ?? "",
    currencyCode: text.normalize(current.breakdown?.currencyCode ?? ""),
    message: current.result?.message ?? "",
  };
  const slots = new Headers();
  slots.set("x-notes", record.notes);
  slots.set("x-notification-template-id", record.notificationTemplateId);
  slots.set("x-currency-code", record.currencyCode);
  slots.set("x-message", record.message);
  const writer = new communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  await call<communityModerationLifecycleServiceApi.SuspendModerationRequest, communityModerationLifecycleServiceApi.SuspendModerationResponse>(
    (request, done) => writer.suspendModeration(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    communityModerationLifecycleServiceApi.SuspendModerationRequest.fromPartial({ reason: slots.get("x-notification-template-id") ?? "" }));
}
