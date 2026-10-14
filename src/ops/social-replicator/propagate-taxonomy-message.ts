import * as contentTaxonomyLifecycleServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_lifecycle_service.js";
import * as modelregistryRegisteredModelCalculationServiceApi from "../../../.cache/proto/acme/modelregistry/v1/registered_model_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateTaxonomyMessage keeps of each ActivateTaxonomy response. */
interface PropagateTaxonomyMessageRecord {
  message: string;
  status: string;
}

/** Where propagateTaxonomyMessage hands each record. */
interface PropagateTaxonomyMessageSink {
  forward(record: PropagateTaxonomyMessageRecord): Promise<void>;
}

/** Hands records to acme.modelregistry.v1.RegisteredModelCalculationService. */
class PropagateTaxonomyMessageRegisteredModelCalculation implements PropagateTaxonomyMessageSink {
  private readonly client: modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateTaxonomyMessageRecord): Promise<void> {
    await retry(() => call<modelregistryRegisteredModelCalculationServiceApi.GetRegisteredModelRatesRequest, modelregistryRegisteredModelCalculationServiceApi.GetRegisteredModelRatesResponse>(
      (request, done) => this.client.getRegisteredModelRates(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      modelregistryRegisteredModelCalculationServiceApi.GetRegisteredModelRatesRequest.fromPartial({ registeredModelId: record.message })));
  }
}

/**
 * Reads acme.content.v1.TaxonomyLifecycleService/ActivateTaxonomy and hands what it keeps to
 * acme.modelregistry.v1.RegisteredModelCalculationService.
 */
export async function propagateTaxonomyMessage(runtime: Runtime): Promise<void> {
  const reader = new contentTaxonomyLifecycleServiceApi.TaxonomyLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<contentTaxonomyLifecycleServiceApi.ActivateTaxonomyRequest, contentTaxonomyLifecycleServiceApi.ActivateTaxonomyResponse>(
    (request, done) => reader.activateTaxonomy(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    contentTaxonomyLifecycleServiceApi.ActivateTaxonomyRequest.fromPartial({ taxonomyId: "current-propagate-taxonomy-message" }));
  const row: PropagateTaxonomyMessageRecord = {
    message: reply.result?.message ?? "",
    status: reply.outcome?.status ?? "",
  };
  await new PropagateTaxonomyMessageRegisteredModelCalculation(runtime).forward(row);
}
