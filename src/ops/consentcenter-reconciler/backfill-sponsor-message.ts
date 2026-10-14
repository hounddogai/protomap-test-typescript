import * as localizationTranslationJobCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillSponsorMessage keeps of each QuoteSponsor response. */
interface BackfillSponsorMessageRecord {
  message: string;
  correlationId: string;
  status: string;
  sponsorId: string;
}

/**
 * Reads acme.sponsorships.v1.SponsorCalculationService/QuoteSponsor, keeps its fields by name, and passes
 * some of them to acme.localization.v1.TranslationJobCalculationService.
 */
export async function backfillSponsorMessage(runtime: Runtime): Promise<void> {
  const source = new sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<sponsorshipsSponsorCalculationServiceApi.QuoteSponsorRequest, sponsorshipsSponsorCalculationServiceApi.QuoteSponsorResponse>(
    (request, done) => source.quoteSponsor(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    sponsorshipsSponsorCalculationServiceApi.QuoteSponsorRequest.fromPartial({ reason: "live-backfill-sponsor-message" }));
  const row: BackfillSponsorMessageRecord = {
    message: text.normalize(found.result?.message ?? ""),
    correlationId: found.result?.correlationId ?? "",
    status: found.result?.status ?? "",
    sponsorId: found.sponsor?.sponsorId ?? "",
  };
  const params = new URLSearchParams();
  params.set("message", row.message);
  params.set("correlation-id", row.correlationId);
  params.set("status", row.status);
  params.set("sponsor-id", row.sponsorId);
  const sink = new localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest, localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsResponse>(
    (request, done) => sink.compareTranslationJobOptions(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    localizationTranslationJobCalculationServiceApi.CompareTranslationJobOptionsRequest.fromPartial({ translationJobId: params.get("status") ?? "", translationJob: { subject: params.get("message") ?? "" } }));
}
