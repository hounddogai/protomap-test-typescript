import * as communityModerationApprovalServiceApi from "../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as corporateeventsCorporateEventQueryServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_query_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorProfileCalculationId keeps of each ExplainProfileCalculation response. */
interface MirrorProfileCalculationIdRecord {
  profileId: string;
  correlationId: string;
}

/** Where mirrorProfileCalculationId hands each record. */
interface MirrorProfileCalculationIdDestination {
  forward(record: MirrorProfileCalculationIdRecord): Promise<void>;
}

/** Passes records to acme.community.v1.ModerationApprovalService. */
class MirrorProfileCalculationIdModerationApproval implements MirrorProfileCalculationIdDestination {
  private readonly client: communityModerationApprovalServiceApi.ModerationApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationApprovalServiceApi.ModerationApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorProfileCalculationIdRecord): Promise<void> {
    await retry(() => call<communityModerationApprovalServiceApi.SubmitModerationRequest, communityModerationApprovalServiceApi.SubmitModerationResponse>(
      (request, done) => this.client.submitModeration(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityModerationApprovalServiceApi.SubmitModerationRequest.fromPartial({ moderation: { moderationId: record.profileId }, moderationId: record.correlationId })));
  }
}

/** Passes records to acme.corporateevents.v1.CorporateEventQueryService. */
class MirrorProfileCalculationIdCorporateEventQuery implements MirrorProfileCalculationIdDestination {
  private readonly client: corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorProfileCalculationIdRecord): Promise<void> {
    await retry(() => call<corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsRequest, corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsResponse>(
      (request, done) => this.client.summarizeCorporateEvents(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      corporateeventsCorporateEventQueryServiceApi.SummarizeCorporateEventsRequest.fromPartial({ details: { format: record.correlationId }, corporateEventId: record.profileId })));
  }
}

/**
 * Reads acme.personalization.v1.ProfileCalculationService/ExplainProfileCalculation and hands what it keeps
 * to the sink of its kind.
 */
export async function mirrorProfileCalculationId(runtime: Runtime): Promise<void> {
  const reader = new personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(
    (request, done) => reader.explainProfileCalculation(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({ profileId: "primary-mirror-profile-calculation-id" }));
  const entry: MirrorProfileCalculationIdRecord = {
    profileId: found.profile?.profileId ?? "",
    correlationId: found.result?.correlationId ?? "",
  };
  const sinks: MirrorProfileCalculationIdDestination[] = [
    new MirrorProfileCalculationIdModerationApproval(runtime),
    new MirrorProfileCalculationIdCorporateEventQuery(runtime),
  ];
  await sinks[1]!.forward(entry);
}
