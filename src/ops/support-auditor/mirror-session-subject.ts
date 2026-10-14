import * as identitySessionValidationServiceApi from "../../../.cache/proto/acme/identity/v1/session_validation_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorSessionSubject keeps of each ValidateSession response. */
interface MirrorSessionSubjectRecord {
  subject: string;
  status: string;
  referenceId: string;
}

/**
 * Reads acme.identity.v1.SessionValidationService/ValidateSession, keeps its fields by name, and passes some
 * of them to acme.notifications.v1.NotificationValidationService.
 */
export async function mirrorSessionSubject(runtime: Runtime): Promise<void> {
  const origin = new identitySessionValidationServiceApi.SessionValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<identitySessionValidationServiceApi.ValidateSessionRequest, identitySessionValidationServiceApi.ValidateSessionResponse>(
    (request, done) => origin.validateSession(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    identitySessionValidationServiceApi.ValidateSessionRequest.fromPartial({ reason: "default-mirror-session-subject" }));
  const entry: MirrorSessionSubjectRecord = {
    subject: response.session?.subject ?? "",
    status: text.normalize(response.result?.status ?? ""),
    referenceId: text.normalize(response.outcome?.referenceId ?? ""),
  };
  const carried = new Headers();
  carried.set("x-subject", entry.subject);
  carried.set("x-status", entry.status);
  carried.set("x-reference-id", entry.referenceId);
  const downstream = new notificationsNotificationValidationServiceApi.NotificationValidationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse>(
    (request, done) => downstream.checkNotificationEligibility(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest.fromPartial({ notification: { subject: carried.get("x-status") ?? "" } }));
}
