import * as concessionsConcessionStandServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyConcessionStandStatus keeps of each CreateConcessionStand response. */
interface CopyConcessionStandStatusRecord {
  status: string;
  correlationId: string;
  name: string;
}

/**
 * Reads acme.concessions.v1.ConcessionStandService/CreateConcessionStand, keeps its fields by name, and
 * passes some of them to acme.localization.v1.LocaleCalculationService.
 */
export async function copyConcessionStandStatus(runtime: Runtime): Promise<void> {
  const origin = new concessionsConcessionStandServiceApi.ConcessionStandServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<concessionsConcessionStandServiceApi.CreateConcessionStandRequest, concessionsConcessionStandServiceApi.CreateConcessionStandResponse>(
    (request, done) => origin.createConcessionStand(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    concessionsConcessionStandServiceApi.CreateConcessionStandRequest.fromPartial({ requestId: "main-copy-concession-stand-status" }));
  const kept: CopyConcessionStandStatusRecord = {
    status: current.result?.status ?? "",
    correlationId: current.result?.correlationId ?? "",
    name: text.normalize(current.concessionStand?.name ?? ""),
  };
  const params = new URLSearchParams();
  params.set("status", kept.status);
  params.set("correlation-id", kept.correlationId);
  params.set("name", kept.name);
  const downstream = new localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<localizationLocaleCalculationServiceApi.QuoteLocaleRequest, localizationLocaleCalculationServiceApi.QuoteLocaleResponse>(
    (request, done) => downstream.quoteLocale(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    localizationLocaleCalculationServiceApi.QuoteLocaleRequest.fromPartial({ details: { currencyCode: params.get("name") ?? "" } })));
}
