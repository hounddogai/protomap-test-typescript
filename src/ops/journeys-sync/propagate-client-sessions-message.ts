import * as riskRiskRegisterQueryServiceApi from "../../../.cache/proto/acme/risk/v1/risk_register_query_service.js";
import * as webbffClientSessionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateClientSessionsMessage keeps of each CountClientSessions response. */
interface PropagateClientSessionsMessageRecord {
  message: string;
  status: string;
  correlationId: string;
}

/** Where propagateClientSessionsMessage hands each record. */
interface PropagateClientSessionsMessageSink {
  apply(record: PropagateClientSessionsMessageRecord): Promise<void>;
}

/** Passes records to acme.risk.v1.RiskRegisterQueryService. */
class PropagateClientSessionsMessageRiskRegisterQuery implements PropagateClientSessionsMessageSink {
  private readonly client: riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateClientSessionsMessageRecord): Promise<void> {
    await call<riskRiskRegisterQueryServiceApi.SuggestRiskRegistersRequest, riskRiskRegisterQueryServiceApi.SuggestRiskRegistersResponse>(
      (request, done) => this.client.suggestRiskRegisters(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      riskRiskRegisterQueryServiceApi.SuggestRiskRegistersRequest.fromPartial({ filter: { region: record.status, query: record.correlationId, ownerId: record.message } }));
  }
}

/**
 * Reads acme.webbff.v1.ClientSessionQueryService/CountClientSessions and hands what it keeps to
 * acme.risk.v1.RiskRegisterQueryService.
 */
export async function propagateClientSessionsMessage(runtime: Runtime): Promise<void> {
  const upstream = new webbffClientSessionQueryServiceApi.ClientSessionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<webbffClientSessionQueryServiceApi.CountClientSessionsRequest, webbffClientSessionQueryServiceApi.CountClientSessionsResponse>(
    (request, done) => upstream.countClientSessions(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    webbffClientSessionQueryServiceApi.CountClientSessionsRequest.fromPartial({ orderBy: "default-propagate-client-sessions-message" }));
  const record: PropagateClientSessionsMessageRecord = {
    message: current.result?.message ?? "",
    status: current.result?.status ?? "",
    correlationId: current.result?.correlationId ?? "",
  };
  await new PropagateClientSessionsMessageRiskRegisterQuery(runtime).apply(record);
}
