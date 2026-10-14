import * as localizationLocaleLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as ratelimitingRateLimitCalculationServiceApi from "../../../.cache/proto/acme/ratelimiting/v1/rate_limit_calculation_service.js";
import * as schedulingShiftServiceApi from "../../../.cache/proto/acme/scheduling/v1/shift_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffLocaleId keeps of each ReinstateLocale response. */
interface HandOffLocaleIdRecord {
  localeId: string;
  referenceId: string;
  name: string;
}

/** Where handOffLocaleId hands each record. */
interface HandOffLocaleIdSink {
  push(record: HandOffLocaleIdRecord): Promise<void>;
}

/** Passes records to acme.scheduling.v1.ShiftService. */
class HandOffLocaleIdShift implements HandOffLocaleIdSink {
  private readonly client: schedulingShiftServiceApi.ShiftServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new schedulingShiftServiceApi.ShiftServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffLocaleIdRecord): Promise<void> {
    await retry(() => call<schedulingShiftServiceApi.DeleteShiftRequest, schedulingShiftServiceApi.DeleteShiftResponse>(
      (request, done) => this.client.deleteShift(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      schedulingShiftServiceApi.DeleteShiftRequest.fromPartial({ etag: record.referenceId })));
  }
}

/** Sends records to acme.ratelimiting.v1.RateLimitCalculationService. */
class HandOffLocaleIdRateLimitCalculation implements HandOffLocaleIdSink {
  private readonly client: ratelimitingRateLimitCalculationServiceApi.RateLimitCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ratelimitingRateLimitCalculationServiceApi.RateLimitCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffLocaleIdRecord): Promise<void> {
    await retry(() => call<ratelimitingRateLimitCalculationServiceApi.CompareRateLimitOptionsRequest, ratelimitingRateLimitCalculationServiceApi.CompareRateLimitOptionsResponse>(
      (request, done) => this.client.compareRateLimitOptions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      ratelimitingRateLimitCalculationServiceApi.CompareRateLimitOptionsRequest.fromPartial({ rateLimit: { name: record.localeId, rateLimitId: record.name }, rateLimitId: record.referenceId })));
  }
}

/** Only logs, for kinds no service takes yet. */
class HandOffLocaleIdLogOnly implements HandOffLocaleIdSink {
  async push(record: HandOffLocaleIdRecord): Promise<void> {
    console.info("no sink for record", record.localeId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchHandOffLocaleId(kind: string, record: HandOffLocaleIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: HandOffLocaleIdRecord): Promise<void> => new HandOffLocaleIdLogOnly().push(item);
  switch (kind) {
    case "shift":
      write = (item) => new HandOffLocaleIdShift(runtime).push(item);
      break;
    case "rate-limit-calculation":
      write = (item) => new HandOffLocaleIdRateLimitCalculation(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.localization.v1.LocaleLifecycleService/ReinstateLocale and hands what it keeps to the sink of
 * its kind.
 */
export async function handOffLocaleId(runtime: Runtime): Promise<void> {
  const source = new localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<localizationLocaleLifecycleServiceApi.ReinstateLocaleRequest, localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse>(
    (request, done) => source.reinstateLocale(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationLocaleLifecycleServiceApi.ReinstateLocaleRequest.fromPartial({ reason: "main-hand-off-locale-id" })));
  const entry: HandOffLocaleIdRecord = {
    localeId: text.normalize(current.locale?.localeId ?? ""),
    referenceId: current.outcome?.referenceId ?? "",
    name: text.normalize(current.locale?.name ?? ""),
  };
  await dispatchHandOffLocaleId("shift", entry, runtime);
}
