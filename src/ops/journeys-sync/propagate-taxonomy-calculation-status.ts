import * as contentTaxonomyCalculationServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as formsFormQueryServiceApi from "../../../.cache/proto/acme/forms/v1/form_query_service.js";
import * as formsFormSubmissionValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_validation_service.js";
import * as sellersSellerQueryServiceApi from "../../../.cache/proto/acme/sellers/v1/seller_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateTaxonomyCalculationStatus keeps of each ExplainTaxonomyCalculation response. */
interface PropagateTaxonomyCalculationStatusRecord {
  status: string;
  message: string;
  referenceId: string;
  name: string;
}

/** Where propagateTaxonomyCalculationStatus hands each record. */
interface PropagateTaxonomyCalculationStatusWriter {
  push(record: PropagateTaxonomyCalculationStatusRecord): Promise<void>;
}

/** Passes records to acme.forms.v1.FormQueryService. */
class PropagateTaxonomyCalculationStatusFormQuery implements PropagateTaxonomyCalculationStatusWriter {
  private readonly client: formsFormQueryServiceApi.FormQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormQueryServiceApi.FormQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateTaxonomyCalculationStatusRecord): Promise<void> {
    await call<formsFormQueryServiceApi.BrowseFormsRequest, formsFormQueryServiceApi.BrowseFormsResponse>(
      (request, done) => this.client.browseForms(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      formsFormQueryServiceApi.BrowseFormsRequest.fromPartial({ page: { pageToken: record.name } }));
  }
}

/** Writes records to acme.forms.v1.FormSubmissionValidationService. */
class PropagateTaxonomyCalculationStatusFormSubmissionValidation implements PropagateTaxonomyCalculationStatusWriter {
  private readonly client: formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionValidationServiceApi.FormSubmissionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateTaxonomyCalculationStatusRecord): Promise<void> {
    await call<formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest, formsFormSubmissionValidationServiceApi.LintFormSubmissionsResponse>(
      (request, done) => this.client.lintFormSubmissions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      formsFormSubmissionValidationServiceApi.LintFormSubmissionsRequest.fromPartial({ formSubmissionId: record.message, formSubmission: { source: record.referenceId, correlationId: record.status } }));
  }
}

/** Hands records to acme.sellers.v1.SellerQueryService. */
class PropagateTaxonomyCalculationStatusSellerQuery implements PropagateTaxonomyCalculationStatusWriter {
  private readonly client: sellersSellerQueryServiceApi.SellerQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sellersSellerQueryServiceApi.SellerQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: PropagateTaxonomyCalculationStatusRecord): Promise<void> {
    await call<sellersSellerQueryServiceApi.SuggestSellersRequest, sellersSellerQueryServiceApi.SuggestSellersResponse>(
      (request, done) => this.client.suggestSellers(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      sellersSellerQueryServiceApi.SuggestSellersRequest.fromPartial({ filter: { region: record.status } }));
  }
}

/**
 * Reads acme.content.v1.TaxonomyCalculationService/ExplainTaxonomyCalculation and hands what it keeps to the
 * sink of its kind.
 */
export async function propagateTaxonomyCalculationStatus(runtime: Runtime): Promise<void> {
  const reader = new contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest, contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse>(
    (request, done) => reader.explainTaxonomyCalculation(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest.fromPartial({ reason: "live-propagate-taxonomy-calculation-status" }));
  const row: PropagateTaxonomyCalculationStatusRecord = {
    status: current.outcome?.status ?? "",
    message: current.outcome?.message ?? "",
    referenceId: current.outcome?.referenceId ?? "",
    name: current.taxonomy?.name ?? "",
  };
  const sinks = new Map<string, PropagateTaxonomyCalculationStatusWriter>();
  sinks.set("form-query", new PropagateTaxonomyCalculationStatusFormQuery(runtime));
  sinks.set("form-submission-validation", new PropagateTaxonomyCalculationStatusFormSubmissionValidation(runtime));
  sinks.set("seller-query", new PropagateTaxonomyCalculationStatusSellerQuery(runtime));
  await sinks.get("form-submission-validation")!.push(row);
}
