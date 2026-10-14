import * as communityModerationCalculationServiceApi from "../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as lineageLineageNodeQueryServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleLineageNodeId keeps of each LookupLineageNode response. */
interface SettleLineageNodeIdRecord {
  lineageNodeId: string;
  name: string;
  correlationId: string;
  status: string;
}

/** Where settleLineageNodeId hands each record. */
interface SettleLineageNodeIdTarget {
  send(record: SettleLineageNodeIdRecord): Promise<void>;
}

/** Passes records to acme.community.v1.ModerationCalculationService. */
class SettleLineageNodeIdModerationCalculation implements SettleLineageNodeIdTarget {
  private readonly client: communityModerationCalculationServiceApi.ModerationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationCalculationServiceApi.ModerationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleLineageNodeIdRecord): Promise<void> {
    await retry(() => call<communityModerationCalculationServiceApi.SimulateModerationRequest, communityModerationCalculationServiceApi.SimulateModerationResponse>(
      (request, done) => this.client.simulateModeration(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityModerationCalculationServiceApi.SimulateModerationRequest.fromPartial({ moderationId: record.correlationId, moderation: { moderationId: record.name, subject: record.status } })));
  }
}

/**
 * Reads acme.lineage.v1.LineageNodeQueryService/LookupLineageNode and hands what it keeps to
 * acme.community.v1.ModerationCalculationService.
 */
export async function settleLineageNodeId(runtime: Runtime): Promise<void> {
  const source = new lineageLineageNodeQueryServiceApi.LineageNodeQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<lineageLineageNodeQueryServiceApi.LookupLineageNodeRequest, lineageLineageNodeQueryServiceApi.LookupLineageNodeResponse>(
    (request, done) => source.lookupLineageNode(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    lineageLineageNodeQueryServiceApi.LookupLineageNodeRequest.fromPartial({ lineageNodeId: "nightly-settle-lineage-node-id" }));
  const entry: SettleLineageNodeIdRecord = {
    lineageNodeId: reply.lineageNode?.lineageNodeId ?? "",
    name: reply.lineageNode?.name ?? "",
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
    status: reply.result?.status ?? "",
  };
  await new SettleLineageNodeIdModerationCalculation(runtime).send(entry);
}
