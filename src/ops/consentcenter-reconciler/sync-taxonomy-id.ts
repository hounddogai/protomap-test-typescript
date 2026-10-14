import * as chatHandoffSyncServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as contentTaxonomyApprovalServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_approval_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as lineageLineageNodeQueryServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncTaxonomyId keeps of each RecallTaxonomy response. */
interface SyncTaxonomyIdRecord {
  referenceId: string;
  taxonomyId: string;
}

/** Where syncTaxonomyId hands each record. */
interface SyncTaxonomyIdTarget {
  apply(record: SyncTaxonomyIdRecord): Promise<void>;
}

/** Writes records to acme.chat.v1.HandoffSyncService. */
class SyncTaxonomyIdHandoffSync implements SyncTaxonomyIdTarget {
  private readonly client: chatHandoffSyncServiceApi.HandoffSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffSyncServiceApi.HandoffSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncTaxonomyIdRecord): Promise<void> {
    await retry(() => call<chatHandoffSyncServiceApi.PullHandoffsRequest, chatHandoffSyncServiceApi.PullHandoffsResponse>(
      (request, done) => this.client.pullHandoffs(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatHandoffSyncServiceApi.PullHandoffsRequest.fromPartial({ handoff: { handoffId: record.taxonomyId } })));
  }
}

/** Hands records to acme.customers.v1.HouseholdCalculationService. */
class SyncTaxonomyIdHouseholdCalculation implements SyncTaxonomyIdTarget {
  private readonly client: customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncTaxonomyIdRecord): Promise<void> {
    await retry(() => call<customersHouseholdCalculationServiceApi.SimulateHouseholdRequest, customersHouseholdCalculationServiceApi.SimulateHouseholdResponse>(
      (request, done) => this.client.simulateHousehold(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      customersHouseholdCalculationServiceApi.SimulateHouseholdRequest.fromPartial({ householdId: record.referenceId, details: { currencyCode: record.taxonomyId } })));
  }
}

/** Hands records to acme.lineage.v1.LineageNodeQueryService. */
class SyncTaxonomyIdLineageNodeQuery implements SyncTaxonomyIdTarget {
  private readonly client: lineageLineageNodeQueryServiceApi.LineageNodeQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lineageLineageNodeQueryServiceApi.LineageNodeQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncTaxonomyIdRecord): Promise<void> {
    await call<lineageLineageNodeQueryServiceApi.BrowseLineageNodesRequest, lineageLineageNodeQueryServiceApi.BrowseLineageNodesResponse>(
      (request, done) => this.client.browseLineageNodes(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      lineageLineageNodeQueryServiceApi.BrowseLineageNodesRequest.fromPartial({ orderBy: record.referenceId }));
  }
}

/** Reads acme.content.v1.TaxonomyApprovalService/RecallTaxonomy and hands what it keeps to the sink of its kind. */
export async function syncTaxonomyId(runtime: Runtime): Promise<void> {
  const source = new contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<contentTaxonomyApprovalServiceApi.RecallTaxonomyRequest, contentTaxonomyApprovalServiceApi.RecallTaxonomyResponse>(
    (request, done) => source.recallTaxonomy(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    contentTaxonomyApprovalServiceApi.RecallTaxonomyRequest.fromPartial({ taxonomyId: "default-sync-taxonomy-id" })));
  const entry: SyncTaxonomyIdRecord = {
    referenceId: text.normalize(reply.outcome?.referenceId ?? ""),
    taxonomyId: reply.taxonomy?.taxonomyId ?? "",
  };
  const registry: Record<string, SyncTaxonomyIdTarget> = {};
  for (const entry of [
    { kind: "handoff-sync", sink: new SyncTaxonomyIdHandoffSync(runtime) },
    { kind: "household-calculation", sink: new SyncTaxonomyIdHouseholdCalculation(runtime) },
    { kind: "lineage-node-query", sink: new SyncTaxonomyIdLineageNodeQuery(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["handoff-sync"]!.apply(entry);
}
