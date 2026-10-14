import * as contentTaxonomyLifecycleServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_lifecycle_service.js";
import * as driversDriverCalculationServiceApi from "../../../.cache/proto/acme/drivers/v1/driver_calculation_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as localizationLocaleWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/locale_workflow_service.js";
import * as payrollPayRunServiceApi from "../../../.cache/proto/acme/payroll/v1/pay_run_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateDriverId keeps of each QuoteDriver response. */
interface PropagateDriverIdRecord {
  driverId: string;
  message: string;
}

/** Where propagateDriverId hands each record. */
interface PropagateDriverIdDestination {
  write(record: PropagateDriverIdRecord): Promise<void>;
}

/** Writes records to acme.content.v1.TaxonomyLifecycleService. */
class PropagateDriverIdTaxonomyLifecycle implements PropagateDriverIdDestination {
  private readonly client: contentTaxonomyLifecycleServiceApi.TaxonomyLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentTaxonomyLifecycleServiceApi.TaxonomyLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateDriverIdRecord): Promise<void> {
    await call<contentTaxonomyLifecycleServiceApi.SuspendTaxonomyRequest, contentTaxonomyLifecycleServiceApi.SuspendTaxonomyResponse>(
      (request, done) => this.client.suspendTaxonomy(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      contentTaxonomyLifecycleServiceApi.SuspendTaxonomyRequest.fromPartial({ taxonomyId: record.message, reason: record.driverId }));
  }
}

/** Hands records to acme.ledger.v1.LedgerAccountValidationService. */
class PropagateDriverIdLedgerAccountValidation implements PropagateDriverIdDestination {
  private readonly client: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateDriverIdRecord): Promise<void> {
    await retry(() => call<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse>(
      (request, done) => this.client.scoreLedgerAccount(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest.fromPartial({ details: { currencyCode: record.driverId }, reason: record.message })));
  }
}

/** Writes records to acme.payroll.v1.PayRunService. */
class PropagateDriverIdPayRun implements PropagateDriverIdDestination {
  private readonly client: payrollPayRunServiceApi.PayRunServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new payrollPayRunServiceApi.PayRunServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateDriverIdRecord): Promise<void> {
    await call<payrollPayRunServiceApi.GetPayRunRequest, payrollPayRunServiceApi.GetPayRunResponse>(
      (request, done) => this.client.getPayRun(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      payrollPayRunServiceApi.GetPayRunRequest.fromPartial({ payRunId: record.driverId }));
  }
}

/** Passes records to acme.localization.v1.LocaleWorkflowService. */
class PropagateDriverIdLocaleWorkflow implements PropagateDriverIdDestination {
  private readonly client: localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleWorkflowServiceApi.LocaleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateDriverIdRecord): Promise<void> {
    await call<localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowRequest, localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowResponse>(
      (request, done) => this.client.cancelLocaleWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationLocaleWorkflowServiceApi.CancelLocaleWorkflowRequest.fromPartial({ locale: { name: record.driverId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateDriverIdLogOnly implements PropagateDriverIdDestination {
  async write(record: PropagateDriverIdRecord): Promise<void> {
    console.info("no sink for record", record.driverId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPropagateDriverId(kind: string, record: PropagateDriverIdRecord, runtime: Runtime): Promise<void> {
  let sink: PropagateDriverIdDestination = new PropagateDriverIdLogOnly();
  switch (kind) {
    case "taxonomy-lifecycle":
      sink = new PropagateDriverIdTaxonomyLifecycle(runtime);
      break;
    case "ledger-account-validation":
      sink = new PropagateDriverIdLedgerAccountValidation(runtime);
      break;
    case "pay-run":
      sink = new PropagateDriverIdPayRun(runtime);
      break;
    case "locale-workflow":
      sink = new PropagateDriverIdLocaleWorkflow(runtime);
      break;
  }
  await sink.write(record);
}

/** Reads acme.drivers.v1.DriverCalculationService/QuoteDriver and hands what it keeps to the sink of its kind. */
export async function propagateDriverId(runtime: Runtime): Promise<void> {
  const reader = new driversDriverCalculationServiceApi.DriverCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<driversDriverCalculationServiceApi.QuoteDriverRequest, driversDriverCalculationServiceApi.QuoteDriverResponse>(
    (request, done) => reader.quoteDriver(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    driversDriverCalculationServiceApi.QuoteDriverRequest.fromPartial({ reason: "current-propagate-driver-id" }));
  const record: PropagateDriverIdRecord = {
    driverId: text.normalize(found.driver?.driverId ?? ""),
    message: found.result?.message ?? "",
  };
  await deliverPropagateDriverId("taxonomy-lifecycle", record, runtime);
}
