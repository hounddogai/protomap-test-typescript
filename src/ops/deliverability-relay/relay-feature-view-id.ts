import * as campaignsCampaignBudgetWorkflowServiceApi from "../../../.cache/proto/acme/campaigns/v1/campaign_budget_workflow_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as featurestoreFeatureViewQueryServiceApi from "../../../.cache/proto/acme/featurestore/v1/feature_view_query_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as webbffWidgetLayoutServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayFeatureViewId keeps of each LookupFeatureView response. */
interface RelayFeatureViewIdRecord {
  featureViewId: string;
  correlationId: string;
  name: string;
}

/** Where relayFeatureViewId hands each record. */
interface RelayFeatureViewIdWriter {
  write(record: RelayFeatureViewIdRecord): Promise<void>;
}

/** Hands records to acme.surveys.v1.QuestionCalculationService. */
class RelayFeatureViewIdQuestionCalculation implements RelayFeatureViewIdWriter {
  private readonly client: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayFeatureViewIdRecord): Promise<void> {
    await call<surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest, surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse>(
      (request, done) => this.client.compareQuestionOptions(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest.fromPartial({ reason: record.correlationId, questionId: record.name }));
  }
}

/** Sends records to acme.campaigns.v1.CampaignBudgetWorkflowService. */
class RelayFeatureViewIdCampaignBudgetWorkflow implements RelayFeatureViewIdWriter {
  private readonly client: campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsCampaignBudgetWorkflowServiceApi.CampaignBudgetWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayFeatureViewIdRecord): Promise<void> {
    await call<campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowRequest, campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowResponse>(
      (request, done) => this.client.advanceCampaignBudgetWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      campaignsCampaignBudgetWorkflowServiceApi.AdvanceCampaignBudgetWorkflowRequest.fromPartial({ details: { initiatedBy: record.name, step: record.featureViewId } }));
  }
}

/** Writes records to acme.experiments.v1.ExperimentValidationService. */
class RelayFeatureViewIdExperimentValidation implements RelayFeatureViewIdWriter {
  private readonly client: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayFeatureViewIdRecord): Promise<void> {
    await retry(() => call<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse>(
      (request, done) => this.client.normalizeExperiment(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsExperimentValidationServiceApi.NormalizeExperimentRequest.fromPartial({ reason: record.correlationId, experiment: { experimentId: record.name }, experimentId: record.featureViewId })));
  }
}

/** Hands records to acme.webbff.v1.WidgetLayoutService. */
class RelayFeatureViewIdWidgetLayout implements RelayFeatureViewIdWriter {
  private readonly client: webbffWidgetLayoutServiceApi.WidgetLayoutServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffWidgetLayoutServiceApi.WidgetLayoutServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayFeatureViewIdRecord): Promise<void> {
    await call<webbffWidgetLayoutServiceApi.ListWidgetLayoutsRequest, webbffWidgetLayoutServiceApi.ListWidgetLayoutsResponse>(
      (request, done) => this.client.listWidgetLayouts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webbffWidgetLayoutServiceApi.ListWidgetLayoutsRequest.fromPartial({ filter: { query: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayFeatureViewIdLogOnly implements RelayFeatureViewIdWriter {
  async write(record: RelayFeatureViewIdRecord): Promise<void> {
    console.info("no sink for record", record.featureViewId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchRelayFeatureViewId(kind: string, record: RelayFeatureViewIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: RelayFeatureViewIdRecord): Promise<void> => new RelayFeatureViewIdLogOnly().write(item);
  switch (kind) {
    case "question-calculation":
      write = (item) => new RelayFeatureViewIdQuestionCalculation(runtime).write(item);
      break;
    case "campaign-budget-workflow":
      write = (item) => new RelayFeatureViewIdCampaignBudgetWorkflow(runtime).write(item);
      break;
    case "experiment-validation":
      write = (item) => new RelayFeatureViewIdExperimentValidation(runtime).write(item);
      break;
    case "widget-layout":
      write = (item) => new RelayFeatureViewIdWidgetLayout(runtime).write(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.featurestore.v1.FeatureViewQueryService/LookupFeatureView and hands what it keeps to the sink of
 * its kind.
 */
export async function relayFeatureViewId(runtime: Runtime): Promise<void> {
  const upstream = new featurestoreFeatureViewQueryServiceApi.FeatureViewQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<featurestoreFeatureViewQueryServiceApi.LookupFeatureViewRequest, featurestoreFeatureViewQueryServiceApi.LookupFeatureViewResponse>(
    (request, done) => upstream.lookupFeatureView(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    featurestoreFeatureViewQueryServiceApi.LookupFeatureViewRequest.fromPartial({ featureViewId: "live-relay-feature-view-id" }));
  const row: RelayFeatureViewIdRecord = {
    featureViewId: reply.featureView?.featureViewId ?? "",
    correlationId: reply.result?.correlationId ?? "",
    name: reply.featureView?.name ?? "",
  };
  await dispatchRelayFeatureViewId("experiment-validation", row, runtime);
}
