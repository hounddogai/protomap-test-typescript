import * as corporateeventsCorporateEventQueryServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_query_service.js";
import * as driversDriverCalculationServiceApi from "../../../.cache/proto/acme/drivers/v1/driver_calculation_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as riskRiskRegisterQueryServiceApi from "../../../.cache/proto/acme/risk/v1/risk_register_query_service.js";
import * as secretsSecretQueryServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorDriverId keeps of each SimulateDriver response. */
interface MirrorDriverIdRecord {
  driverId: string;
  status: string;
  message: string;
}

/** Where mirrorDriverId hands each record. */
interface MirrorDriverIdTarget {
  forward(record: MirrorDriverIdRecord): Promise<void>;
}

/** Passes records to acme.corporateevents.v1.CorporateEventQueryService. */
class MirrorDriverIdCorporateEventQuery implements MirrorDriverIdTarget {
  private readonly client: corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventQueryServiceApi.CorporateEventQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorDriverIdRecord): Promise<void> {
    await call<corporateeventsCorporateEventQueryServiceApi.CountCorporateEventsRequest, corporateeventsCorporateEventQueryServiceApi.CountCorporateEventsResponse>(
      (request, done) => this.client.countCorporateEvents(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      corporateeventsCorporateEventQueryServiceApi.CountCorporateEventsRequest.fromPartial({ filter: { query: record.message } }));
  }
}

/** Sends records to acme.secrets.v1.SecretQueryService. */
class MirrorDriverIdSecretQuery implements MirrorDriverIdTarget {
  private readonly client: secretsSecretQueryServiceApi.SecretQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new secretsSecretQueryServiceApi.SecretQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorDriverIdRecord): Promise<void> {
    await retry(() => call<secretsSecretQueryServiceApi.BrowseSecretsRequest, secretsSecretQueryServiceApi.BrowseSecretsResponse>(
      (request, done) => this.client.browseSecrets(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      secretsSecretQueryServiceApi.BrowseSecretsRequest.fromPartial({ filter: { ownerId: record.driverId }, page: { pageToken: record.status } })));
  }
}

/** Writes records to acme.risk.v1.RiskRegisterQueryService. */
class MirrorDriverIdRiskRegisterQuery implements MirrorDriverIdTarget {
  private readonly client: riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new riskRiskRegisterQueryServiceApi.RiskRegisterQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorDriverIdRecord): Promise<void> {
    await call<riskRiskRegisterQueryServiceApi.SummarizeRiskRegistersRequest, riskRiskRegisterQueryServiceApi.SummarizeRiskRegistersResponse>(
      (request, done) => this.client.summarizeRiskRegisters(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      riskRiskRegisterQueryServiceApi.SummarizeRiskRegistersRequest.fromPartial({ details: { cron: record.message } }));
  }
}

/** Passes records to acme.localization.v1.LocaleApprovalService. */
class MirrorDriverIdLocaleApproval implements MirrorDriverIdTarget {
  private readonly client: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorDriverIdRecord): Promise<void> {
    await call<localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusRequest, localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusResponse>(
      (request, done) => this.client.getLocaleApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationLocaleApprovalServiceApi.GetLocaleApprovalStatusRequest.fromPartial({ localeId: record.driverId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class MirrorDriverIdLogOnly implements MirrorDriverIdTarget {
  async forward(record: MirrorDriverIdRecord): Promise<void> {
    console.info("no sink for record", record.driverId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchMirrorDriverId(kind: string, record: MirrorDriverIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: MirrorDriverIdRecord): Promise<void> => new MirrorDriverIdLogOnly().forward(item);
  switch (kind) {
    case "corporate-event-query":
      write = (item) => new MirrorDriverIdCorporateEventQuery(runtime).forward(item);
      break;
    case "secret-query":
      write = (item) => new MirrorDriverIdSecretQuery(runtime).forward(item);
      break;
    case "risk-register-query":
      write = (item) => new MirrorDriverIdRiskRegisterQuery(runtime).forward(item);
      break;
    case "locale-approval":
      write = (item) => new MirrorDriverIdLocaleApproval(runtime).forward(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.drivers.v1.DriverCalculationService/SimulateDriver and hands what it keeps to the sink of its
 * kind.
 */
export async function mirrorDriverId(runtime: Runtime): Promise<void> {
  const source = new driversDriverCalculationServiceApi.DriverCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<driversDriverCalculationServiceApi.SimulateDriverRequest, driversDriverCalculationServiceApi.SimulateDriverResponse>(
    (request, done) => source.simulateDriver(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    driversDriverCalculationServiceApi.SimulateDriverRequest.fromPartial({ driverId: "live-mirror-driver-id" }));
  const entry: MirrorDriverIdRecord = {
    driverId: response.driver?.driverId ?? "",
    status: response.result?.status ?? "",
    message: text.normalize(response.result?.message ?? ""),
  };
  await dispatchMirrorDriverId("locale-approval", entry, runtime);
}
