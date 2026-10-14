import * as audiencesAudienceValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateAudienceDecisionMessage keeps of each ExplainAudienceDecision response. */
interface PropagateAudienceDecisionMessageRecord {
  message: string;
  status: string;
  audienceId: string;
  outcomeMessage: string;
}

/** Where propagateAudienceDecisionMessage hands each record. */
interface PropagateAudienceDecisionMessageWriter {
  apply(record: PropagateAudienceDecisionMessageRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.SubscriptionSyncService. */
class PropagateAudienceDecisionMessageSubscriptionSync implements PropagateAudienceDecisionMessageWriter {
  private readonly client: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateAudienceDecisionMessageRecord): Promise<void> {
    await call<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse>(
      (request, done) => this.client.listSubscriptionConflicts(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest.fromPartial({ filter: { ownerId: record.audienceId }, page: { pageToken: record.message }, orderBy: record.outcomeMessage }));
  }
}

/** Writes records to acme.sponsorships.v1.SponsorCalculationService. */
class PropagateAudienceDecisionMessageSponsorCalculation implements PropagateAudienceDecisionMessageWriter {
  private readonly client: sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateAudienceDecisionMessageRecord): Promise<void> {
    await call<sponsorshipsSponsorCalculationServiceApi.CompareSponsorOptionsRequest, sponsorshipsSponsorCalculationServiceApi.CompareSponsorOptionsResponse>(
      (request, done) => this.client.compareSponsorOptions(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      sponsorshipsSponsorCalculationServiceApi.CompareSponsorOptionsRequest.fromPartial({ sponsor: { sponsorId: record.outcomeMessage }, details: { currencyCode: record.audienceId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnPropagateAudienceDecisionMessage(kind: string, record: PropagateAudienceDecisionMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "subscription-sync": () => new PropagateAudienceDecisionMessageSubscriptionSync(runtime).apply(record),
    "sponsor-calculation": () => new PropagateAudienceDecisionMessageSponsorCalculation(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.audiences.v1.AudienceValidationService/ExplainAudienceDecision and hands what it keeps to the
 * sink of its kind.
 */
export async function propagateAudienceDecisionMessage(runtime: Runtime): Promise<void> {
  const upstream = new audiencesAudienceValidationServiceApi.AudienceValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest, audiencesAudienceValidationServiceApi.ExplainAudienceDecisionResponse>(
    (request, done) => upstream.explainAudienceDecision(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    audiencesAudienceValidationServiceApi.ExplainAudienceDecisionRequest.fromPartial({ reason: "nightly-propagate-audience-decision-message" }));
  const entry: PropagateAudienceDecisionMessageRecord = {
    message: text.normalize(current.result?.message ?? ""),
    status: current.result?.status ?? "",
    audienceId: current.audience?.audienceId ?? "",
    outcomeMessage: current.outcome?.message ?? "",
  };
  await actOnPropagateAudienceDecisionMessage("subscription-sync", entry, runtime);
}
