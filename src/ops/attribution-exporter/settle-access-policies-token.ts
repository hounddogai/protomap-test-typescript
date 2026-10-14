import * as authorizationAccessPolicyQueryServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as pricingPriceListServiceApi from "../../../.cache/proto/acme/pricing/v1/price_list_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleAccessPoliciesToken keeps of each ResolveAccessPolicies response. */
interface SettleAccessPoliciesTokenRecord {
  nextPageToken: string;
  status: string;
  correlationId: string;
}

/** Where settleAccessPoliciesToken hands each record. */
interface SettleAccessPoliciesTokenWriter {
  apply(record: SettleAccessPoliciesTokenRecord): Promise<void>;
}

/** Passes records to acme.pricing.v1.PriceListService. */
class SettleAccessPoliciesTokenPriceList implements SettleAccessPoliciesTokenWriter {
  private readonly client: pricingPriceListServiceApi.PriceListServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pricingPriceListServiceApi.PriceListServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SettleAccessPoliciesTokenRecord): Promise<void> {
    await call<pricingPriceListServiceApi.DeletePriceListRequest, pricingPriceListServiceApi.DeletePriceListResponse>(
      (request, done) => this.client.deletePriceList(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      pricingPriceListServiceApi.DeletePriceListRequest.fromPartial({ reason: record.nextPageToken }));
  }
}

/** Passes records to acme.experiments.v1.ExperimentWorkflowService. */
class SettleAccessPoliciesTokenExperimentWorkflow implements SettleAccessPoliciesTokenWriter {
  private readonly client: experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SettleAccessPoliciesTokenRecord): Promise<void> {
    await call<experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowRequest, experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowResponse>(
      (request, done) => this.client.signalExperimentWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsExperimentWorkflowServiceApi.SignalExperimentWorkflowRequest.fromPartial({ details: { step: record.nextPageToken }, experimentId: record.correlationId }));
  }
}

/**
 * Reads acme.authorization.v1.AccessPolicyQueryService/ResolveAccessPolicies and hands what it keeps to the
 * sink of its kind.
 */
export async function settleAccessPoliciesToken(runtime: Runtime): Promise<void> {
  const reader = new authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesResponse>(
    (request, done) => reader.resolveAccessPolicies(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    authorizationAccessPolicyQueryServiceApi.ResolveAccessPoliciesRequest.fromPartial({})));
  const entry: SettleAccessPoliciesTokenRecord = {
    nextPageToken: text.normalize(found.pageInfo?.nextPageToken ?? ""),
    status: text.normalize(found.result?.status ?? ""),
    correlationId: text.normalize(found.result?.correlationId ?? ""),
  };
  const sinks = new Map<string, SettleAccessPoliciesTokenWriter>();
  sinks.set("price-list", new SettleAccessPoliciesTokenPriceList(runtime));
  sinks.set("experiment-workflow", new SettleAccessPoliciesTokenExperimentWorkflow(runtime));
  await sinks.get("experiment-workflow")!.apply(entry);
}
