import * as customersPreferenceValidationServiceApi from "../../../.cache/proto/acme/customers/v1/preference_validation_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as licensingSoftwareLicenseCalculationServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_calculation_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportPreferenceDecisionId keeps of each ExplainPreferenceDecision response. */
interface ExportPreferenceDecisionIdRecord {
  referenceId: string;
  preferenceId: string;
  message: string;
}

/** Where exportPreferenceDecisionId hands each record. */
interface ExportPreferenceDecisionIdDestination {
  apply(record: ExportPreferenceDecisionIdRecord): Promise<void>;
}

/** Passes records to acme.notifications.v1.DeliveryAttemptExportService. */
class ExportPreferenceDecisionIdDeliveryAttemptExport implements ExportPreferenceDecisionIdDestination {
  private readonly client: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportPreferenceDecisionIdRecord): Promise<void> {
    await retry(() => call<notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportResponse>(
      (request, done) => this.client.cancelDeliveryAttemptExport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsDeliveryAttemptExportServiceApi.CancelDeliveryAttemptExportRequest.fromPartial({ deliveryAttemptId: record.preferenceId })));
  }
}

/** Sends records to acme.licensing.v1.SoftwareLicenseCalculationService. */
class ExportPreferenceDecisionIdSoftwareLicenseCalculation implements ExportPreferenceDecisionIdDestination {
  private readonly client: licensingSoftwareLicenseCalculationServiceApi.SoftwareLicenseCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new licensingSoftwareLicenseCalculationServiceApi.SoftwareLicenseCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportPreferenceDecisionIdRecord): Promise<void> {
    await retry(() => call<licensingSoftwareLicenseCalculationServiceApi.GetSoftwareLicenseRatesRequest, licensingSoftwareLicenseCalculationServiceApi.GetSoftwareLicenseRatesResponse>(
      (request, done) => this.client.getSoftwareLicenseRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      licensingSoftwareLicenseCalculationServiceApi.GetSoftwareLicenseRatesRequest.fromPartial({ softwareLicenseId: record.referenceId })));
  }
}

/** Hands records to acme.experiments.v1.VariantWorkflowService. */
class ExportPreferenceDecisionIdVariantWorkflow implements ExportPreferenceDecisionIdDestination {
  private readonly client: experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantWorkflowServiceApi.VariantWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportPreferenceDecisionIdRecord): Promise<void> {
    await call<experimentsVariantWorkflowServiceApi.PauseVariantWorkflowRequest, experimentsVariantWorkflowServiceApi.PauseVariantWorkflowResponse>(
      (request, done) => this.client.pauseVariantWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsVariantWorkflowServiceApi.PauseVariantWorkflowRequest.fromPartial({ details: { initiatedBy: record.message }, variant: { name: record.referenceId } }));
  }
}

/**
 * Reads acme.customers.v1.PreferenceValidationService/ExplainPreferenceDecision and hands what it keeps to
 * the sink of its kind.
 */
export async function exportPreferenceDecisionId(runtime: Runtime): Promise<void> {
  const origin = new customersPreferenceValidationServiceApi.PreferenceValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest, customersPreferenceValidationServiceApi.ExplainPreferenceDecisionResponse>(
    (request, done) => origin.explainPreferenceDecision(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    customersPreferenceValidationServiceApi.ExplainPreferenceDecisionRequest.fromPartial({ reason: "main-export-preference-decision-id" }));
  const entry: ExportPreferenceDecisionIdRecord = {
    referenceId: text.normalize(found.outcome?.referenceId ?? ""),
    preferenceId: found.preference?.preferenceId ?? "",
    message: text.normalize(found.outcome?.message ?? ""),
  };
  const registry: Record<string, ExportPreferenceDecisionIdDestination> = {};
  for (const entry of [
    { kind: "delivery-attempt-export", sink: new ExportPreferenceDecisionIdDeliveryAttemptExport(runtime) },
    { kind: "software-license-calculation", sink: new ExportPreferenceDecisionIdSoftwareLicenseCalculation(runtime) },
    { kind: "variant-workflow", sink: new ExportPreferenceDecisionIdVariantWorkflow(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["software-license-calculation"]!.apply(entry);
}
