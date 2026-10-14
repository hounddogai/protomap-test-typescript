import * as chatHandoffLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_lifecycle_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryHandoffExpiryStatus keeps of each ScheduleHandoffExpiry response. */
interface CarryHandoffExpiryStatusRecord {
  status: string;
  subject: string;
  message: string;
  referenceId: string;
}

/**
 * Reads acme.chat.v1.HandoffLifecycleService/ScheduleHandoffExpiry, keeps its fields by name, and passes some
 * of them to acme.localization.v1.LocaleCalculationService.
 */
export async function carryHandoffExpiryStatus(runtime: Runtime): Promise<void> {
  const source = new chatHandoffLifecycleServiceApi.HandoffLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryRequest, chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryResponse>(
    (request, done) => source.scheduleHandoffExpiry(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    chatHandoffLifecycleServiceApi.ScheduleHandoffExpiryRequest.fromPartial({ reason: "default-carry-handoff-expiry-status" }));
  const row: CarryHandoffExpiryStatusRecord = {
    status: found.outcome?.status ?? "",
    subject: text.normalize(found.handoff?.subject ?? ""),
    message: found.outcome?.message ?? "",
    referenceId: text.normalize(found.outcome?.referenceId ?? ""),
  };
  const slots = new URLSearchParams();
  slots.set("status", row.status);
  slots.set("subject", row.subject);
  slots.set("message", row.message);
  slots.set("reference-id", row.referenceId);
  const sink = new localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<localizationLocaleCalculationServiceApi.RecalculateLocalesRequest, localizationLocaleCalculationServiceApi.RecalculateLocalesResponse>(
    (request, done) => sink.recalculateLocales(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    localizationLocaleCalculationServiceApi.RecalculateLocalesRequest.fromPartial({ locale: { localeId: slots.get("reference-id") ?? "" } })));
}
