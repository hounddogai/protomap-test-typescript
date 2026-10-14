import * as boxofficeBoxOfficeSaleCalculationServiceApi from "../../../.cache/proto/acme/boxoffice/v1/box_office_sale_calculation_service.js";
import * as fleetVehicleServiceApi from "../../../.cache/proto/acme/fleet/v1/vehicle_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webhooksWebhookEndpointServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardSearchIndexesStatus keeps of each CountSearchIndexes response. */
interface ForwardSearchIndexesStatusRecord {
  status: string;
  message: string;
}

/** Where forwardSearchIndexesStatus hands each record. */
interface ForwardSearchIndexesStatusTarget {
  write(record: ForwardSearchIndexesStatusRecord): Promise<void>;
}

/** Passes records to acme.fleet.v1.VehicleService. */
class ForwardSearchIndexesStatusVehicle implements ForwardSearchIndexesStatusTarget {
  private readonly client: fleetVehicleServiceApi.VehicleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fleetVehicleServiceApi.VehicleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardSearchIndexesStatusRecord): Promise<void> {
    await retry(() => call<fleetVehicleServiceApi.CreateVehicleRequest, fleetVehicleServiceApi.CreateVehicleResponse>(
      (request, done) => this.client.createVehicle(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      fleetVehicleServiceApi.CreateVehicleRequest.fromPartial({ vehicle: { name: record.message }, requestId: record.status })));
  }
}

/** Hands records to acme.boxoffice.v1.BoxOfficeSaleCalculationService. */
class ForwardSearchIndexesStatusBoxOfficeSaleCalculation implements ForwardSearchIndexesStatusTarget {
  private readonly client: boxofficeBoxOfficeSaleCalculationServiceApi.BoxOfficeSaleCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new boxofficeBoxOfficeSaleCalculationServiceApi.BoxOfficeSaleCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardSearchIndexesStatusRecord): Promise<void> {
    await retry(() => call<boxofficeBoxOfficeSaleCalculationServiceApi.QuoteBoxOfficeSaleRequest, boxofficeBoxOfficeSaleCalculationServiceApi.QuoteBoxOfficeSaleResponse>(
      (request, done) => this.client.quoteBoxOfficeSale(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      boxofficeBoxOfficeSaleCalculationServiceApi.QuoteBoxOfficeSaleRequest.fromPartial({ reason: record.status })));
  }
}

/** Hands records to acme.webbff.v1.ClientSessionIntegrationService. */
class ForwardSearchIndexesStatusClientSessionIntegration implements ForwardSearchIndexesStatusTarget {
  private readonly client: webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardSearchIndexesStatusRecord): Promise<void> {
    await call<webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventRequest, webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventResponse>(
      (request, done) => this.client.acknowledgeClientSessionEvent(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventRequest.fromPartial({ details: { endpoint: record.status, sourceSystem: record.message } }));
  }
}

/** Writes records to acme.webhooks.v1.WebhookEndpointService. */
class ForwardSearchIndexesStatusWebhookEndpoint implements ForwardSearchIndexesStatusTarget {
  private readonly client: webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookEndpointServiceApi.WebhookEndpointServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardSearchIndexesStatusRecord): Promise<void> {
    await call<webhooksWebhookEndpointServiceApi.CloneWebhookEndpointRequest, webhooksWebhookEndpointServiceApi.CloneWebhookEndpointResponse>(
      (request, done) => this.client.cloneWebhookEndpoint(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webhooksWebhookEndpointServiceApi.CloneWebhookEndpointRequest.fromPartial({ requestId: record.message }));
  }
}

/**
 * Reads acme.search.v1.SearchIndexQueryService/CountSearchIndexes and hands what it keeps to the sink of its
 * kind.
 */
export async function forwardSearchIndexesStatus(runtime: Runtime): Promise<void> {
  const origin = new searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<searchSearchIndexQueryServiceApi.CountSearchIndexesRequest, searchSearchIndexQueryServiceApi.CountSearchIndexesResponse>(
    (request, done) => origin.countSearchIndexes(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    searchSearchIndexQueryServiceApi.CountSearchIndexesRequest.fromPartial({ orderBy: "live-forward-search-indexes-status" })));
  const row: ForwardSearchIndexesStatusRecord = {
    status: reply.result?.status ?? "",
    message: reply.result?.message ?? "",
  };
  const sinks: ForwardSearchIndexesStatusTarget[] = [
    new ForwardSearchIndexesStatusVehicle(runtime),
    new ForwardSearchIndexesStatusBoxOfficeSaleCalculation(runtime),
    new ForwardSearchIndexesStatusClientSessionIntegration(runtime),
    new ForwardSearchIndexesStatusWebhookEndpoint(runtime),
  ];
  await sinks[0]!.write(row);
}
