import * as assetsFixedAssetCalculationServiceApi from "../../../.cache/proto/acme/assets/v1/fixed_asset_calculation_service.js";
import * as communityBadgeCalculationServiceApi from "../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryFixedAssetId keeps of each QuoteFixedAsset response. */
interface CarryFixedAssetIdRecord {
  fixedAssetId: string;
  status: string;
  message: string;
}

/** Where carryFixedAssetId hands each record. */
interface CarryFixedAssetIdTarget {
  deliver(record: CarryFixedAssetIdRecord): Promise<void>;
}

/** Passes records to acme.community.v1.BadgeCalculationService. */
class CarryFixedAssetIdBadgeCalculation implements CarryFixedAssetIdTarget {
  private readonly client: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeCalculationServiceApi.BadgeCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryFixedAssetIdRecord): Promise<void> {
    await call<communityBadgeCalculationServiceApi.GetBadgeRatesRequest, communityBadgeCalculationServiceApi.GetBadgeRatesResponse>(
      (request, done) => this.client.getBadgeRates(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityBadgeCalculationServiceApi.GetBadgeRatesRequest.fromPartial({ badgeId: record.fixedAssetId }));
  }
}

/** Sends records to acme.localization.v1.LocaleLifecycleService. */
class CarryFixedAssetIdLocaleLifecycle implements CarryFixedAssetIdTarget {
  private readonly client: localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryFixedAssetIdRecord): Promise<void> {
    await retry(() => call<localizationLocaleLifecycleServiceApi.GetLocaleLifecycleRequest, localizationLocaleLifecycleServiceApi.GetLocaleLifecycleResponse>(
      (request, done) => this.client.getLocaleLifecycle(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationLocaleLifecycleServiceApi.GetLocaleLifecycleRequest.fromPartial({ localeId: record.status })));
  }
}

/** Writes records to acme.sponsorships.v1.SponsorCalculationService. */
class CarryFixedAssetIdSponsorCalculation implements CarryFixedAssetIdTarget {
  private readonly client: sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarryFixedAssetIdRecord): Promise<void> {
    await retry(() => call<sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest, sponsorshipsSponsorCalculationServiceApi.SimulateSponsorResponse>(
      (request, done) => this.client.simulateSponsor(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest.fromPartial({ sponsor: { sponsorId: record.status } })));
  }
}

/**
 * Reads acme.assets.v1.FixedAssetCalculationService/QuoteFixedAsset and hands what it keeps to the sink of
 * its kind.
 */
export async function carryFixedAssetId(runtime: Runtime): Promise<void> {
  const upstream = new assetsFixedAssetCalculationServiceApi.FixedAssetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<assetsFixedAssetCalculationServiceApi.QuoteFixedAssetRequest, assetsFixedAssetCalculationServiceApi.QuoteFixedAssetResponse>(
    (request, done) => upstream.quoteFixedAsset(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    assetsFixedAssetCalculationServiceApi.QuoteFixedAssetRequest.fromPartial({ reason: "current-carry-fixed-asset-id" }));
  const kept: CarryFixedAssetIdRecord = {
    fixedAssetId: response.fixedAsset?.fixedAssetId ?? "",
    status: response.result?.status ?? "",
    message: text.normalize(response.result?.message ?? ""),
  };
  const sinks = new Map<string, CarryFixedAssetIdTarget>([
    ["badge-calculation", new CarryFixedAssetIdBadgeCalculation(runtime)],
    ["locale-lifecycle", new CarryFixedAssetIdLocaleLifecycle(runtime)],
    ["sponsor-calculation", new CarryFixedAssetIdSponsorCalculation(runtime)],
  ]);
  const sink = sinks.get(process.env["CARRY_FIXED_ASSET_ID_TARGET"] ?? "");
  if (!sink) return;
  await sink.deliver(kept);
}
