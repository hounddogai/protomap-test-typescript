import * as communityBadgeLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import * as concessionsConcessionStandQueryServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_query_service.js";
import * as featurestoreFeatureViewCalculationServiceApi from "../../../.cache/proto/acme/featurestore/v1/feature_view_calculation_service.js";
import * as localizationTranslationJobWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryFeatureViewOptionsId keeps of each CompareFeatureViewOptions response. */
interface CarryFeatureViewOptionsIdRecord {
  correlationId: string;
  code: string;
}

/** Where carryFeatureViewOptionsId hands each record. */
interface CarryFeatureViewOptionsIdWriter {
  write(record: CarryFeatureViewOptionsIdRecord): Promise<void>;
}

/** Hands records to acme.localization.v1.TranslationJobWorkflowService. */
class CarryFeatureViewOptionsIdTranslationJobWorkflow implements CarryFeatureViewOptionsIdWriter {
  private readonly client: localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryFeatureViewOptionsIdRecord): Promise<void> {
    await call<localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowRequest, localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowResponse>(
      (request, done) => this.client.signalTranslationJobWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationTranslationJobWorkflowServiceApi.SignalTranslationJobWorkflowRequest.fromPartial({ translationJobId: record.correlationId }));
  }
}

/** Sends records to acme.concessions.v1.ConcessionStandQueryService. */
class CarryFeatureViewOptionsIdConcessionStandQuery implements CarryFeatureViewOptionsIdWriter {
  private readonly client: concessionsConcessionStandQueryServiceApi.ConcessionStandQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new concessionsConcessionStandQueryServiceApi.ConcessionStandQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryFeatureViewOptionsIdRecord): Promise<void> {
    await call<concessionsConcessionStandQueryServiceApi.SuggestConcessionStandsRequest, concessionsConcessionStandQueryServiceApi.SuggestConcessionStandsResponse>(
      (request, done) => this.client.suggestConcessionStands(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      concessionsConcessionStandQueryServiceApi.SuggestConcessionStandsRequest.fromPartial({ filter: { ownerId: record.code }, orderBy: record.correlationId }));
  }
}

/** Passes records to acme.community.v1.BadgeLifecycleService. */
class CarryFeatureViewOptionsIdBadgeLifecycle implements CarryFeatureViewOptionsIdWriter {
  private readonly client: communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryFeatureViewOptionsIdRecord): Promise<void> {
    await retry(() => call<communityBadgeLifecycleServiceApi.SuspendBadgeRequest, communityBadgeLifecycleServiceApi.SuspendBadgeResponse>(
      (request, done) => this.client.suspendBadge(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityBadgeLifecycleServiceApi.SuspendBadgeRequest.fromPartial({ reason: record.correlationId })));
  }
}

/**
 * Reads acme.featurestore.v1.FeatureViewCalculationService/CompareFeatureViewOptions and hands what it keeps
 * to the sink of its kind.
 */
export async function carryFeatureViewOptionsId(runtime: Runtime): Promise<void> {
  const source = new featurestoreFeatureViewCalculationServiceApi.FeatureViewCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsRequest, featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsResponse>(
    (request, done) => source.compareFeatureViewOptions(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    featurestoreFeatureViewCalculationServiceApi.CompareFeatureViewOptionsRequest.fromPartial({ reason: "current-carry-feature-view-options-id" })));
  const entry: CarryFeatureViewOptionsIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    code: reply.featureView?.code ?? "",
  };
  const registry: Record<string, CarryFeatureViewOptionsIdWriter> = {};
  for (const entry of [
    { kind: "translation-job-workflow", sink: new CarryFeatureViewOptionsIdTranslationJobWorkflow(runtime) },
    { kind: "concession-stand-query", sink: new CarryFeatureViewOptionsIdConcessionStandQuery(runtime) },
    { kind: "badge-lifecycle", sink: new CarryFeatureViewOptionsIdBadgeLifecycle(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["concession-stand-query"]!.write(entry);
}
