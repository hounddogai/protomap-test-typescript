import * as experimentsExperimentCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as modelregistryRegisteredModelQueryServiceApi from "../../../.cache/proto/acme/modelregistry/v1/registered_model_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportRegisteredModelsStatus keeps of each ResolveRegisteredModels response. */
interface ExportRegisteredModelsStatusRecord {
  status: string;
  correlationId: string;
  nextPageToken: string;
}

/**
 * Reads acme.modelregistry.v1.RegisteredModelQueryService/ResolveRegisteredModels, keeps its fields by name,
 * and passes some of them to acme.experiments.v1.ExperimentCalculationService.
 */
export async function exportRegisteredModelsStatus(runtime: Runtime): Promise<void> {
  const origin = new modelregistryRegisteredModelQueryServiceApi.RegisteredModelQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<modelregistryRegisteredModelQueryServiceApi.ResolveRegisteredModelsRequest, modelregistryRegisteredModelQueryServiceApi.ResolveRegisteredModelsResponse>(
    (request, done) => origin.resolveRegisteredModels(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    modelregistryRegisteredModelQueryServiceApi.ResolveRegisteredModelsRequest.fromPartial({}));
  const entry: ExportRegisteredModelsStatusRecord = {
    status: found.result?.status ?? "",
    correlationId: found.result?.correlationId ?? "",
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
  };
  const fields = new URLSearchParams();
  fields.set("status", entry.status);
  fields.set("correlation-id", entry.correlationId);
  fields.set("next-page-token", entry.nextPageToken);
  const target = new experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<experimentsExperimentCalculationServiceApi.CalculateExperimentRequest, experimentsExperimentCalculationServiceApi.CalculateExperimentResponse>(
    (request, done) => target.calculateExperiment(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsExperimentCalculationServiceApi.CalculateExperimentRequest.fromPartial({ details: { currencyCode: fields.get("correlation-id") ?? "" } }));
}
