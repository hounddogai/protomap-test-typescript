import * as audiencesAudienceWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as datasetsDatasetQueryServiceApi from "../../../.cache/proto/acme/datasets/v1/dataset_query_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardSubscriptionStatus keeps of each EstimateSubscription response. */
interface ForwardSubscriptionStatusRecord {
  status: string;
  currencyCode: string;
  subscriptionId: string;
  description: string;
}

/** Where forwardSubscriptionStatus hands each record. */
interface ForwardSubscriptionStatusTarget {
  write(record: ForwardSubscriptionStatusRecord): Promise<void>;
}

/** Sends records to acme.audiences.v1.AudienceWorkflowService. */
class ForwardSubscriptionStatusAudienceWorkflow implements ForwardSubscriptionStatusTarget {
  private readonly client: audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardSubscriptionStatusRecord): Promise<void> {
    await call<audiencesAudienceWorkflowServiceApi.InspectAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.InspectAudienceWorkflowResponse>(
      (request, done) => this.client.inspectAudienceWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      audiencesAudienceWorkflowServiceApi.InspectAudienceWorkflowRequest.fromPartial({ audienceId: record.status }));
  }
}

/** Sends records to acme.datasets.v1.DatasetQueryService. */
class ForwardSubscriptionStatusDatasetQuery implements ForwardSubscriptionStatusTarget {
  private readonly client: datasetsDatasetQueryServiceApi.DatasetQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new datasetsDatasetQueryServiceApi.DatasetQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardSubscriptionStatusRecord): Promise<void> {
    await call<datasetsDatasetQueryServiceApi.BrowseDatasetsRequest, datasetsDatasetQueryServiceApi.BrowseDatasetsResponse>(
      (request, done) => this.client.browseDatasets(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      datasetsDatasetQueryServiceApi.BrowseDatasetsRequest.fromPartial({ filter: { query: record.status }, orderBy: record.currencyCode }));
  }
}

/** Runs the action registered for kind. */
async function actOnForwardSubscriptionStatus(kind: string, record: ForwardSubscriptionStatusRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "audience-workflow": () => new ForwardSubscriptionStatusAudienceWorkflow(runtime).write(record),
    "dataset-query": () => new ForwardSubscriptionStatusDatasetQuery(runtime).write(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.notifications.v1.SubscriptionCalculationService/EstimateSubscription and hands what it keeps to
 * the sink of its kind.
 */
export async function forwardSubscriptionStatus(runtime: Runtime): Promise<void> {
  const source = new notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse>(
    (request, done) => source.estimateSubscription(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest.fromPartial({ subscriptionId: "main-forward-subscription-status" })));
  const row: ForwardSubscriptionStatusRecord = {
    status: response.result?.status ?? "",
    currencyCode: text.normalize(response.breakdown?.currencyCode ?? ""),
    subscriptionId: response.subscription?.subscriptionId ?? "",
    description: response.subscription?.description ?? "",
  };
  await actOnForwardSubscriptionStatus("audience-workflow", row, runtime);
}
