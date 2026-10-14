import * as communityBadgeCalculationServiceApi from "../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as concessionsConcessionStandCalculationServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_calculation_service.js";
import * as experimentsVariantReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryBadgeMessage keeps of each QuoteBadge response. */
interface CarryBadgeMessageRecord {
  message: string;
  currencyCode: string;
  badgeId: string;
}

/** Where carryBadgeMessage hands each record. */
interface CarryBadgeMessageWriter {
  push(record: CarryBadgeMessageRecord): Promise<void>;
}

/** Hands records to acme.sponsorships.v1.SponsorCalculationService. */
class CarryBadgeMessageSponsorCalculation implements CarryBadgeMessageWriter {
  private readonly client: sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryBadgeMessageRecord): Promise<void> {
    await call<sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest, sponsorshipsSponsorCalculationServiceApi.SimulateSponsorResponse>(
      (request, done) => this.client.simulateSponsor(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      sponsorshipsSponsorCalculationServiceApi.SimulateSponsorRequest.fromPartial({ reason: record.badgeId, sponsor: { sponsorId: record.currencyCode }, details: { currencyCode: record.message } }));
  }
}

/** Sends records to acme.experiments.v1.VariantReportingService. */
class CarryBadgeMessageVariantReporting implements CarryBadgeMessageWriter {
  private readonly client: experimentsVariantReportingServiceApi.VariantReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantReportingServiceApi.VariantReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryBadgeMessageRecord): Promise<void> {
    await call<experimentsVariantReportingServiceApi.ShareVariantReportRequest, experimentsVariantReportingServiceApi.ShareVariantReportResponse>(
      (request, done) => this.client.shareVariantReport(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsVariantReportingServiceApi.ShareVariantReportRequest.fromPartial({ details: { channel: record.currencyCode }, reason: record.message, variantId: record.badgeId }));
  }
}

/** Writes records to acme.personalization.v1.ProfileLifecycleService. */
class CarryBadgeMessageProfileLifecycle implements CarryBadgeMessageWriter {
  private readonly client: personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryBadgeMessageRecord): Promise<void> {
    await call<personalizationProfileLifecycleServiceApi.ActivateProfileRequest, personalizationProfileLifecycleServiceApi.ActivateProfileResponse>(
      (request, done) => this.client.activateProfile(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationProfileLifecycleServiceApi.ActivateProfileRequest.fromPartial({ profileId: record.currencyCode }));
  }
}

/** Writes records to acme.concessions.v1.ConcessionStandCalculationService. */
class CarryBadgeMessageConcessionStandCalculation implements CarryBadgeMessageWriter {
  private readonly client: concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryBadgeMessageRecord): Promise<void> {
    await call<concessionsConcessionStandCalculationServiceApi.QuoteConcessionStandRequest, concessionsConcessionStandCalculationServiceApi.QuoteConcessionStandResponse>(
      (request, done) => this.client.quoteConcessionStand(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      concessionsConcessionStandCalculationServiceApi.QuoteConcessionStandRequest.fromPartial({ reason: record.message }));
  }
}

/** Reads acme.community.v1.BadgeCalculationService/QuoteBadge and hands what it keeps to the sink of its kind. */
export async function carryBadgeMessage(runtime: Runtime): Promise<void> {
  const source = new communityBadgeCalculationServiceApi.BadgeCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<communityBadgeCalculationServiceApi.QuoteBadgeRequest, communityBadgeCalculationServiceApi.QuoteBadgeResponse>(
    (request, done) => source.quoteBadge(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    communityBadgeCalculationServiceApi.QuoteBadgeRequest.fromPartial({ reason: "primary-carry-badge-message" }));
  const kept: CarryBadgeMessageRecord = {
    message: found.result?.message ?? "",
    currencyCode: found.breakdown?.currencyCode ?? "",
    badgeId: found.badge?.badgeId ?? "",
  };
  const sinks: CarryBadgeMessageWriter[] = [
    new CarryBadgeMessageSponsorCalculation(runtime),
    new CarryBadgeMessageVariantReporting(runtime),
    new CarryBadgeMessageProfileLifecycle(runtime),
    new CarryBadgeMessageConcessionStandCalculation(runtime),
  ];
  await sinks[1]!.push(kept);
}
