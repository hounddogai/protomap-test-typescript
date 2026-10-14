import * as customersPreferenceCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorNotificationId keeps of each NormalizeNotification response. */
interface MirrorNotificationIdRecord {
  referenceId: string;
  notificationId: string;
}

/** Where mirrorNotificationId hands each record. */
interface MirrorNotificationIdTarget {
  push(record: MirrorNotificationIdRecord): Promise<void>;
}

/** Passes records to acme.localization.v1.TranslationJobApprovalService. */
class MirrorNotificationIdTranslationJobApproval implements MirrorNotificationIdTarget {
  private readonly client: localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: MirrorNotificationIdRecord): Promise<void> {
    await retry(() => call<localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalRequest, localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalResponse>(
      (request, done) => this.client.delegateTranslationJobApproval(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationTranslationJobApprovalServiceApi.DelegateTranslationJobApprovalRequest.fromPartial({ reason: record.notificationId })));
  }
}

/** Sends records to acme.customers.v1.PreferenceCalculationService. */
class MirrorNotificationIdPreferenceCalculation implements MirrorNotificationIdTarget {
  private readonly client: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: MirrorNotificationIdRecord): Promise<void> {
    await call<customersPreferenceCalculationServiceApi.SimulatePreferenceRequest, customersPreferenceCalculationServiceApi.SimulatePreferenceResponse>(
      (request, done) => this.client.simulatePreference(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      customersPreferenceCalculationServiceApi.SimulatePreferenceRequest.fromPartial({ reason: record.notificationId }));
  }
}

/** Runs the action registered for kind. */
async function actOnMirrorNotificationId(kind: string, record: MirrorNotificationIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "translation-job-approval": () => new MirrorNotificationIdTranslationJobApproval(runtime).push(record),
    "preference-calculation": () => new MirrorNotificationIdPreferenceCalculation(runtime).push(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.notifications.v1.NotificationValidationService/NormalizeNotification and hands what it keeps to
 * the sink of its kind.
 */
export async function mirrorNotificationId(runtime: Runtime): Promise<void> {
  const reader = new notificationsNotificationValidationServiceApi.NotificationValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<notificationsNotificationValidationServiceApi.NormalizeNotificationRequest, notificationsNotificationValidationServiceApi.NormalizeNotificationResponse>(
    (request, done) => reader.normalizeNotification(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    notificationsNotificationValidationServiceApi.NormalizeNotificationRequest.fromPartial({ notificationId: "main-mirror-notification-id" }));
  const entry: MirrorNotificationIdRecord = {
    referenceId: found.outcome?.referenceId ?? "",
    notificationId: found.notification?.notificationId ?? "",
  };
  await actOnMirrorNotificationId("preference-calculation", entry, runtime);
}
