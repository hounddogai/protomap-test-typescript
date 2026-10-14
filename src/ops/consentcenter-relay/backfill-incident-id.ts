import * as experimentsExperimentServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as itsmIncidentCalculationServiceApi from "../../../.cache/proto/acme/itsm/v1/incident_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillIncidentId keeps of each EstimateIncident response. */
interface BackfillIncidentIdRecord {
  incidentId: string;
  currencyCode: string;
  status: string;
  message: string;
}

/** Where backfillIncidentId hands each record. */
interface BackfillIncidentIdSink {
  forward(record: BackfillIncidentIdRecord): Promise<void>;
}

/** Hands records to acme.featureflags.v1.FeatureFlagService. */
class BackfillIncidentIdFeatureFlag implements BackfillIncidentIdSink {
  private readonly client: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillIncidentIdRecord): Promise<void> {
    await retry(() => call<featureflagsFeatureFlagServiceApi.GetFeatureFlagRequest, featureflagsFeatureFlagServiceApi.GetFeatureFlagResponse>(
      (request, done) => this.client.getFeatureFlag(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      featureflagsFeatureFlagServiceApi.GetFeatureFlagRequest.fromPartial({ featureFlagId: record.message })));
  }
}

/** Hands records to acme.experiments.v1.ExperimentService. */
class BackfillIncidentIdExperiment implements BackfillIncidentIdSink {
  private readonly client: experimentsExperimentServiceApi.ExperimentServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentServiceApi.ExperimentServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillIncidentIdRecord): Promise<void> {
    await call<experimentsExperimentServiceApi.GetExperimentRequest, experimentsExperimentServiceApi.GetExperimentResponse>(
      (request, done) => this.client.getExperiment(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsExperimentServiceApi.GetExperimentRequest.fromPartial({ experimentId: record.status }));
  }
}

/** Only logs, for kinds no service takes yet. */
class BackfillIncidentIdLogOnly implements BackfillIncidentIdSink {
  async forward(record: BackfillIncidentIdRecord): Promise<void> {
    console.info("no sink for record", record.incidentId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverBackfillIncidentId(kind: string, record: BackfillIncidentIdRecord, runtime: Runtime): Promise<void> {
  let sink: BackfillIncidentIdSink = new BackfillIncidentIdLogOnly();
  switch (kind) {
    case "feature-flag":
      sink = new BackfillIncidentIdFeatureFlag(runtime);
      break;
    case "experiment":
      sink = new BackfillIncidentIdExperiment(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.itsm.v1.IncidentCalculationService/EstimateIncident and hands what it keeps to the sink of its
 * kind.
 */
export async function backfillIncidentId(runtime: Runtime): Promise<void> {
  const reader = new itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<itsmIncidentCalculationServiceApi.EstimateIncidentRequest, itsmIncidentCalculationServiceApi.EstimateIncidentResponse>(
    (request, done) => reader.estimateIncident(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    itsmIncidentCalculationServiceApi.EstimateIncidentRequest.fromPartial({ incidentId: "primary-backfill-incident-id" }));
  const row: BackfillIncidentIdRecord = {
    incidentId: response.incident?.incidentId ?? "",
    currencyCode: response.breakdown?.currencyCode ?? "",
    status: text.normalize(response.result?.status ?? ""),
    message: response.result?.message ?? "",
  };
  await deliverBackfillIncidentId("feature-flag", row, runtime);
}
