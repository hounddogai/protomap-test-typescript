import * as contentTaxonomyLifecycleServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_lifecycle_service.js";
import * as experimentsVariantLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorTaxonomyStatus keeps of each RenewTaxonomy response. */
interface MirrorTaxonomyStatusRecord {
  status: string;
  resultStatus: string;
  taxonomyId: string;
}

/**
 * Reads acme.content.v1.TaxonomyLifecycleService/RenewTaxonomy, keeps its fields by name, and passes some of
 * them to acme.experiments.v1.VariantLifecycleService.
 */
export async function mirrorTaxonomyStatus(runtime: Runtime): Promise<void> {
  const source = new contentTaxonomyLifecycleServiceApi.TaxonomyLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<contentTaxonomyLifecycleServiceApi.RenewTaxonomyRequest, contentTaxonomyLifecycleServiceApi.RenewTaxonomyResponse>(
    (request, done) => source.renewTaxonomy(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    contentTaxonomyLifecycleServiceApi.RenewTaxonomyRequest.fromPartial({ reason: "live-mirror-taxonomy-status" })));
  const entry: MirrorTaxonomyStatusRecord = {
    status: text.normalize(response.outcome?.status ?? ""),
    resultStatus: text.normalize(response.result?.status ?? ""),
    taxonomyId: response.taxonomy?.taxonomyId ?? "",
  };
  const slots = new Headers();
  slots.set("x-status", entry.status);
  slots.set("x-result-status", entry.resultStatus);
  slots.set("x-taxonomy-id", entry.taxonomyId);
  const downstream = new experimentsVariantLifecycleServiceApi.VariantLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  await call<experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest, experimentsVariantLifecycleServiceApi.GetVariantLifecycleResponse>(
    (request, done) => downstream.getVariantLifecycle(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    experimentsVariantLifecycleServiceApi.GetVariantLifecycleRequest.fromPartial({ variantId: slots.get("x-status") ?? "" }));
}
