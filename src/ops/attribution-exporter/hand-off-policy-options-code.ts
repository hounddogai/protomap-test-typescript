import * as insurancePolicyCalculationServiceApi from "../../../.cache/proto/acme/insurance/v1/policy_calculation_service.js";
import * as lineageLineageNodeCalculationServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_calculation_service.js";
import * as messagingChannelCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as showsShowCalculationServiceApi from "../../../.cache/proto/acme/shows/v1/show_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffPolicyOptionsCode keeps of each ComparePolicyOptions response. */
interface HandOffPolicyOptionsCodeRecord {
  currencyCode: string;
  policyId: string;
  status: string;
  correlationId: string;
}

/** Where handOffPolicyOptionsCode hands each record. */
interface HandOffPolicyOptionsCodeSink {
  apply(record: HandOffPolicyOptionsCodeRecord): Promise<void>;
}

/** Hands records to acme.lineage.v1.LineageNodeCalculationService. */
class HandOffPolicyOptionsCodeLineageNodeCalculation implements HandOffPolicyOptionsCodeSink {
  private readonly client: lineageLineageNodeCalculationServiceApi.LineageNodeCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lineageLineageNodeCalculationServiceApi.LineageNodeCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffPolicyOptionsCodeRecord): Promise<void> {
    await call<lineageLineageNodeCalculationServiceApi.EstimateLineageNodeRequest, lineageLineageNodeCalculationServiceApi.EstimateLineageNodeResponse>(
      (request, done) => this.client.estimateLineageNode(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      lineageLineageNodeCalculationServiceApi.EstimateLineageNodeRequest.fromPartial({ reason: record.correlationId, lineageNode: { parentId: record.status } }));
  }
}

/** Hands records to acme.shows.v1.ShowCalculationService. */
class HandOffPolicyOptionsCodeShowCalculation implements HandOffPolicyOptionsCodeSink {
  private readonly client: showsShowCalculationServiceApi.ShowCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new showsShowCalculationServiceApi.ShowCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffPolicyOptionsCodeRecord): Promise<void> {
    await call<showsShowCalculationServiceApi.ExplainShowCalculationRequest, showsShowCalculationServiceApi.ExplainShowCalculationResponse>(
      (request, done) => this.client.explainShowCalculation(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      showsShowCalculationServiceApi.ExplainShowCalculationRequest.fromPartial({ details: { locale: record.currencyCode }, showId: record.correlationId, show: { title: record.status } }));
  }
}

/** Sends records to acme.messaging.v1.ChannelCalculationService. */
class HandOffPolicyOptionsCodeChannelCalculation implements HandOffPolicyOptionsCodeSink {
  private readonly client: messagingChannelCalculationServiceApi.ChannelCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChannelCalculationServiceApi.ChannelCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffPolicyOptionsCodeRecord): Promise<void> {
    await call<messagingChannelCalculationServiceApi.EstimateChannelRequest, messagingChannelCalculationServiceApi.EstimateChannelResponse>(
      (request, done) => this.client.estimateChannel(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingChannelCalculationServiceApi.EstimateChannelRequest.fromPartial({ channel: { code: record.status, name: record.currencyCode } }));
  }
}

/**
 * Reads acme.insurance.v1.PolicyCalculationService/ComparePolicyOptions and hands what it keeps to the sink
 * of its kind.
 */
export async function handOffPolicyOptionsCode(runtime: Runtime): Promise<void> {
  const reader = new insurancePolicyCalculationServiceApi.PolicyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<insurancePolicyCalculationServiceApi.ComparePolicyOptionsRequest, insurancePolicyCalculationServiceApi.ComparePolicyOptionsResponse>(
    (request, done) => reader.comparePolicyOptions(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    insurancePolicyCalculationServiceApi.ComparePolicyOptionsRequest.fromPartial({ policyId: "live-hand-off-policy-options-code" }));
  const entry: HandOffPolicyOptionsCodeRecord = {
    currencyCode: text.normalize(response.breakdown?.currencyCode ?? ""),
    policyId: response.policy?.policyId ?? "",
    status: response.result?.status ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  const registry: Record<string, HandOffPolicyOptionsCodeSink> = {};
  for (const entry of [
    { kind: "lineage-node-calculation", sink: new HandOffPolicyOptionsCodeLineageNodeCalculation(runtime) },
    { kind: "show-calculation", sink: new HandOffPolicyOptionsCodeShowCalculation(runtime) },
    { kind: "channel-calculation", sink: new HandOffPolicyOptionsCodeChannelCalculation(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["lineage-node-calculation"]!.apply(entry);
}
