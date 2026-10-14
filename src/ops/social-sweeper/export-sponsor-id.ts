import * as customersCustomerSegmentValidationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as experimentsVariantSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as fleetVehicleQueryServiceApi from "../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import * as sponsorshipsSponsorServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportSponsorId keeps of each UpdateSponsor response. */
interface ExportSponsorIdRecord {
  sponsorId: string;
  status: string;
  correlationId: string;
  message: string;
}

/** Where exportSponsorId hands each record. */
interface ExportSponsorIdWriter {
  write(record: ExportSponsorIdRecord): Promise<void>;
}

/** Hands records to acme.experiments.v1.VariantSyncService. */
class ExportSponsorIdVariantSync implements ExportSponsorIdWriter {
  private readonly client: experimentsVariantSyncServiceApi.VariantSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantSyncServiceApi.VariantSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ExportSponsorIdRecord): Promise<void> {
    await retry(() => call<experimentsVariantSyncServiceApi.ListVariantConflictsRequest, experimentsVariantSyncServiceApi.ListVariantConflictsResponse>(
      (request, done) => this.client.listVariantConflicts(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsVariantSyncServiceApi.ListVariantConflictsRequest.fromPartial({ filter: { query: record.status } })));
  }
}

/** Hands records to acme.fleet.v1.VehicleQueryService. */
class ExportSponsorIdVehicleQuery implements ExportSponsorIdWriter {
  private readonly client: fleetVehicleQueryServiceApi.VehicleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fleetVehicleQueryServiceApi.VehicleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ExportSponsorIdRecord): Promise<void> {
    await call<fleetVehicleQueryServiceApi.CountVehiclesRequest, fleetVehicleQueryServiceApi.CountVehiclesResponse>(
      (request, done) => this.client.countVehicles(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      fleetVehicleQueryServiceApi.CountVehiclesRequest.fromPartial({ filter: { region: record.status, ownerId: record.correlationId }, orderBy: record.sponsorId }));
  }
}

/** Passes records to acme.customers.v1.CustomerSegmentValidationService. */
class ExportSponsorIdCustomerSegmentValidation implements ExportSponsorIdWriter {
  private readonly client: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ExportSponsorIdRecord): Promise<void> {
    await retry(() => call<customersCustomerSegmentValidationServiceApi.GetCustomerSegmentRulesRequest, customersCustomerSegmentValidationServiceApi.GetCustomerSegmentRulesResponse>(
      (request, done) => this.client.getCustomerSegmentRules(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      customersCustomerSegmentValidationServiceApi.GetCustomerSegmentRulesRequest.fromPartial({ customerSegmentId: record.status })));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportSponsorIdLogOnly implements ExportSponsorIdWriter {
  async write(record: ExportSponsorIdRecord): Promise<void> {
    console.info("no sink for record", record.sponsorId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverExportSponsorId(kind: string, record: ExportSponsorIdRecord, runtime: Runtime): Promise<void> {
  let sink: ExportSponsorIdWriter = new ExportSponsorIdLogOnly();
  switch (kind) {
    case "variant-sync":
      sink = new ExportSponsorIdVariantSync(runtime);
      break;
    case "vehicle-query":
      sink = new ExportSponsorIdVehicleQuery(runtime);
      break;
    case "customer-segment-validation":
      sink = new ExportSponsorIdCustomerSegmentValidation(runtime);
      break;
  }
  await sink.write(record);
}

/** Reads acme.sponsorships.v1.SponsorService/UpdateSponsor and hands what it keeps to the sink of its kind. */
export async function exportSponsorId(runtime: Runtime): Promise<void> {
  const origin = new sponsorshipsSponsorServiceApi.SponsorServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<sponsorshipsSponsorServiceApi.UpdateSponsorRequest, sponsorshipsSponsorServiceApi.UpdateSponsorResponse>(
    (request, done) => origin.updateSponsor(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    sponsorshipsSponsorServiceApi.UpdateSponsorRequest.fromPartial({}));
  const kept: ExportSponsorIdRecord = {
    sponsorId: reply.sponsor?.sponsorId ?? "",
    status: reply.result?.status ?? "",
    correlationId: reply.result?.correlationId ?? "",
    message: reply.result?.message ?? "",
  };
  await deliverExportSponsorId("customer-segment-validation", kept, runtime);
}
