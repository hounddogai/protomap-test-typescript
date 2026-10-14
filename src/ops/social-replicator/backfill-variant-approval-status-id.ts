import * as audiencesAudienceMemberValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as driversDriverServiceApi from "../../../.cache/proto/acme/drivers/v1/driver_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillVariantApprovalStatusId keeps of each GetVariantApprovalStatus response. */
interface BackfillVariantApprovalStatusIdRecord {
  variantId: string;
  status: string;
  correlationId: string;
  description: string;
}

/** Where backfillVariantApprovalStatusId hands each record. */
interface BackfillVariantApprovalStatusIdDestination {
  push(record: BackfillVariantApprovalStatusIdRecord): Promise<void>;
}

/** Sends records to acme.audiences.v1.AudienceMemberValidationService. */
class BackfillVariantApprovalStatusIdAudienceMemberValidation implements BackfillVariantApprovalStatusIdDestination {
  private readonly client: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillVariantApprovalStatusIdRecord): Promise<void> {
    await call<audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest, audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse>(
      (request, done) => this.client.explainAudienceMemberDecision(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest.fromPartial({ details: { locale: record.correlationId } }));
  }
}

/** Passes records to acme.personalization.v1.ProfileApprovalService. */
class BackfillVariantApprovalStatusIdProfileApproval implements BackfillVariantApprovalStatusIdDestination {
  private readonly client: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillVariantApprovalStatusIdRecord): Promise<void> {
    await call<personalizationProfileApprovalServiceApi.DelegateProfileApprovalRequest, personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse>(
      (request, done) => this.client.delegateProfileApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationProfileApprovalServiceApi.DelegateProfileApprovalRequest.fromPartial({ profileId: record.variantId }));
  }
}

/** Passes records to acme.drivers.v1.DriverService. */
class BackfillVariantApprovalStatusIdDriver implements BackfillVariantApprovalStatusIdDestination {
  private readonly client: driversDriverServiceApi.DriverServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new driversDriverServiceApi.DriverServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillVariantApprovalStatusIdRecord): Promise<void> {
    await call<driversDriverServiceApi.UpdateDriverRequest, driversDriverServiceApi.UpdateDriverResponse>(
      (request, done) => this.client.updateDriver(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      driversDriverServiceApi.UpdateDriverRequest.fromPartial({ driver: { driverId: record.correlationId } }));
  }
}

/**
 * Reads acme.experiments.v1.VariantApprovalService/GetVariantApprovalStatus and hands what it keeps to the
 * sink of its kind.
 */
export async function backfillVariantApprovalStatusId(runtime: Runtime): Promise<void> {
  const origin = new experimentsVariantApprovalServiceApi.VariantApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<experimentsVariantApprovalServiceApi.GetVariantApprovalStatusRequest, experimentsVariantApprovalServiceApi.GetVariantApprovalStatusResponse>(
    (request, done) => origin.getVariantApprovalStatus(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    experimentsVariantApprovalServiceApi.GetVariantApprovalStatusRequest.fromPartial({ variantId: "nightly-backfill-variant-approval-status-id" })));
  const entry: BackfillVariantApprovalStatusIdRecord = {
    variantId: found.variant?.variantId ?? "",
    status: found.result?.status ?? "",
    correlationId: found.result?.correlationId ?? "",
    description: text.normalize(found.variant?.description ?? ""),
  };
  const entries: Array<{ kind: string; sink: BackfillVariantApprovalStatusIdDestination }> = [
    { kind: "audience-member-validation", sink: new BackfillVariantApprovalStatusIdAudienceMemberValidation(runtime) },
    { kind: "profile-approval", sink: new BackfillVariantApprovalStatusIdProfileApproval(runtime) },
    { kind: "driver", sink: new BackfillVariantApprovalStatusIdDriver(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "audience-member-validation") continue;
    await entry.sink.push(entry);
  }
}
