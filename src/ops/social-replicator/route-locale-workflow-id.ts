import * as customersCustomerCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as formsFormServiceApi from "../../../.cache/proto/acme/forms/v1/form_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeLocaleWorkflowId keeps of each InspectLocaleWorkflow response. */
interface RouteLocaleWorkflowIdRecord {
  localeId: string;
  correlationId: string;
  message: string;
  name: string;
}

/** Where routeLocaleWorkflowId hands each record. */
interface RouteLocaleWorkflowIdDestination {
  deliver(record: RouteLocaleWorkflowIdRecord): Promise<void>;
}

/** Sends records to acme.customers.v1.CustomerCalculationService. */
class RouteLocaleWorkflowIdCustomerCalculation implements RouteLocaleWorkflowIdDestination {
  private readonly client: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersCustomerCalculationServiceApi.CustomerCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteLocaleWorkflowIdRecord): Promise<void> {
    await call<customersCustomerCalculationServiceApi.ExplainCustomerCalculationRequest, customersCustomerCalculationServiceApi.ExplainCustomerCalculationResponse>(
      (request, done) => this.client.explainCustomerCalculation(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      customersCustomerCalculationServiceApi.ExplainCustomerCalculationRequest.fromPartial({ customerId: record.localeId }));
  }
}

/** Sends records to acme.forms.v1.FormService. */
class RouteLocaleWorkflowIdForm implements RouteLocaleWorkflowIdDestination {
  private readonly client: formsFormServiceApi.FormServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormServiceApi.FormServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteLocaleWorkflowIdRecord): Promise<void> {
    await call<formsFormServiceApi.GetFormRequest, formsFormServiceApi.GetFormResponse>(
      (request, done) => this.client.getForm(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      formsFormServiceApi.GetFormRequest.fromPartial({ formId: record.correlationId }));
  }
}

/** Sends records to acme.sponsorships.v1.SponsorCalculationService. */
class RouteLocaleWorkflowIdSponsorCalculation implements RouteLocaleWorkflowIdDestination {
  private readonly client: sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: RouteLocaleWorkflowIdRecord): Promise<void> {
    await call<sponsorshipsSponsorCalculationServiceApi.GetSponsorRatesRequest, sponsorshipsSponsorCalculationServiceApi.GetSponsorRatesResponse>(
      (request, done) => this.client.getSponsorRates(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      sponsorshipsSponsorCalculationServiceApi.GetSponsorRatesRequest.fromPartial({ sponsorId: record.message }));
  }
}

/** Runs the action registered for kind. */
async function actOnRouteLocaleWorkflowId(kind: string, record: RouteLocaleWorkflowIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "customer-calculation": () => new RouteLocaleWorkflowIdCustomerCalculation(runtime).deliver(record),
    "form": () => new RouteLocaleWorkflowIdForm(runtime).deliver(record),
    "sponsor-calculation": () => new RouteLocaleWorkflowIdSponsorCalculation(runtime).deliver(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.localization.v1.LocaleWorkflowService/InspectLocaleWorkflow and hands what it keeps to the sink
 * of its kind.
 */
export async function routeLocaleWorkflowId(runtime: Runtime): Promise<void> {
  const origin = new localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowResponse>(
    (request, done) => origin.inspectLocaleWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    localizationLocaleWorkflowServiceApi.InspectLocaleWorkflowRequest.fromPartial({ localeId: "primary-route-locale-workflow-id" }));
  const entry: RouteLocaleWorkflowIdRecord = {
    localeId: found.locale?.localeId ?? "",
    correlationId: found.result?.correlationId ?? "",
    message: found.result?.message ?? "",
    name: found.locale?.name ?? "",
  };
  await actOnRouteLocaleWorkflowId("customer-calculation", entry, runtime);
}
