import * as concessionsConcessionStandCalculationServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_calculation_service.js";
import * as driverappDriverHomeQueryServiceApi from "../../../.cache/proto/acme/driverapp/v1/driver_home_query_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffDriverHomesId keeps of each CountDriverHomes response. */
interface HandOffDriverHomesIdRecord {
  correlationId: string;
  message: string;
}

/** Where handOffDriverHomesId hands each record. */
interface HandOffDriverHomesIdSink {
  write(record: HandOffDriverHomesIdRecord): Promise<void>;
}

/** Passes records to acme.webbff.v1.WidgetLayoutIntegrationService. */
class HandOffDriverHomesIdWidgetLayoutIntegration implements HandOffDriverHomesIdSink {
  private readonly client: webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffDriverHomesIdRecord): Promise<void> {
    await retry(() => call<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse>(
      (request, done) => this.client.disconnectWidgetLayoutSource(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest.fromPartial({ details: { endpoint: record.correlationId } })));
  }
}

/** Sends records to acme.concessions.v1.ConcessionStandCalculationService. */
class HandOffDriverHomesIdConcessionStandCalculation implements HandOffDriverHomesIdSink {
  private readonly client: concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffDriverHomesIdRecord): Promise<void> {
    await call<concessionsConcessionStandCalculationServiceApi.QuoteConcessionStandRequest, concessionsConcessionStandCalculationServiceApi.QuoteConcessionStandResponse>(
      (request, done) => this.client.quoteConcessionStand(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      concessionsConcessionStandCalculationServiceApi.QuoteConcessionStandRequest.fromPartial({ concessionStand: { code: record.correlationId } }));
  }
}

/** Writes records to acme.ledger.v1.LedgerAccountService. */
class HandOffDriverHomesIdLedgerAccount implements HandOffDriverHomesIdSink {
  private readonly client: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ledgerLedgerAccountServiceApi.LedgerAccountServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffDriverHomesIdRecord): Promise<void> {
    await call<ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest, ledgerLedgerAccountServiceApi.SearchLedgerAccountsResponse>(
      (request, done) => this.client.searchLedgerAccounts(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      ledgerLedgerAccountServiceApi.SearchLedgerAccountsRequest.fromPartial({ filter: { region: record.message } }));
  }
}

/**
 * Reads acme.driverapp.v1.DriverHomeQueryService/CountDriverHomes and hands what it keeps to the sink of its
 * kind.
 */
export async function handOffDriverHomesId(runtime: Runtime): Promise<void> {
  const upstream = new driverappDriverHomeQueryServiceApi.DriverHomeQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<driverappDriverHomeQueryServiceApi.CountDriverHomesRequest, driverappDriverHomeQueryServiceApi.CountDriverHomesResponse>(
    (request, done) => upstream.countDriverHomes(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    driverappDriverHomeQueryServiceApi.CountDriverHomesRequest.fromPartial({ orderBy: "live-hand-off-driver-homes-id" })));
  const entry: HandOffDriverHomesIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    message: found.result?.message ?? "",
  };
  const registry: Record<string, HandOffDriverHomesIdSink> = {};
  for (const entry of [
    { kind: "widget-layout-integration", sink: new HandOffDriverHomesIdWidgetLayoutIntegration(runtime) },
    { kind: "concession-stand-calculation", sink: new HandOffDriverHomesIdConcessionStandCalculation(runtime) },
    { kind: "ledger-account", sink: new HandOffDriverHomesIdLedgerAccount(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["concession-stand-calculation"]!.write(entry);
}
