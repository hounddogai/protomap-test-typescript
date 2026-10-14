import * as audiencesAudienceValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as messagingChannelValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as riskRiskRegisterQueryServiceApi from "../../../.cache/proto/acme/risk/v1/risk_register_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryRiskRegisterId keeps of each PeekRiskRegister response. */
interface CarryRiskRegisterIdRecord {
  parentId: string;
  correlationId: string;
  message: string;
}

/** Where carryRiskRegisterId hands each record. */
interface CarryRiskRegisterIdTarget {
  push(record: CarryRiskRegisterIdRecord): Promise<void>;
}

/** Passes records to acme.audiences.v1.AudienceValidationService. */
class CarryRiskRegisterIdAudienceValidation implements CarryRiskRegisterIdTarget {
  private readonly client: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceValidationServiceApi.AudienceValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryRiskRegisterIdRecord): Promise<void> {
    await call<audiencesAudienceValidationServiceApi.PreviewAudienceRequest, audiencesAudienceValidationServiceApi.PreviewAudienceResponse>(
      (request, done) => this.client.previewAudience(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceValidationServiceApi.PreviewAudienceRequest.fromPartial({ audience: { name: record.parentId } }));
  }
}

/** Hands records to acme.messaging.v1.ChannelValidationService. */
class CarryRiskRegisterIdChannelValidation implements CarryRiskRegisterIdTarget {
  private readonly client: messagingChannelValidationServiceApi.ChannelValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChannelValidationServiceApi.ChannelValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryRiskRegisterIdRecord): Promise<void> {
    await call<messagingChannelValidationServiceApi.GetChannelRulesRequest, messagingChannelValidationServiceApi.GetChannelRulesResponse>(
      (request, done) => this.client.getChannelRules(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingChannelValidationServiceApi.GetChannelRulesRequest.fromPartial({ channelId: record.correlationId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarryRiskRegisterIdLogOnly implements CarryRiskRegisterIdTarget {
  async push(record: CarryRiskRegisterIdRecord): Promise<void> {
    console.info("no sink for record", record.parentId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverCarryRiskRegisterId(kind: string, record: CarryRiskRegisterIdRecord, runtime: Runtime): Promise<void> {
  let sink: CarryRiskRegisterIdTarget = new CarryRiskRegisterIdLogOnly();
  switch (kind) {
    case "audience-validation":
      sink = new CarryRiskRegisterIdAudienceValidation(runtime);
      break;
    case "channel-validation":
      sink = new CarryRiskRegisterIdChannelValidation(runtime);
      break;
  }
  await sink.push(record);
}

/** Reads acme.risk.v1.RiskRegisterQueryService/PeekRiskRegister and hands what it keeps to the sink of its kind. */
export async function carryRiskRegisterId(runtime: Runtime): Promise<void> {
  const upstream = new riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<riskRiskRegisterQueryServiceApi.PeekRiskRegisterRequest, riskRiskRegisterQueryServiceApi.PeekRiskRegisterResponse>(
    (request, done) => upstream.peekRiskRegister(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    riskRiskRegisterQueryServiceApi.PeekRiskRegisterRequest.fromPartial({ riskRegisterId: "primary-carry-risk-register-id" })));
  const row: CarryRiskRegisterIdRecord = {
    parentId: found.riskRegister?.parentId ?? "",
    correlationId: found.result?.correlationId ?? "",
    message: found.result?.message ?? "",
  };
  await deliverCarryRiskRegisterId("channel-validation", row, runtime);
}
