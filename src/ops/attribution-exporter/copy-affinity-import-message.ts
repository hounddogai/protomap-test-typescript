import * as experimentsExperimentCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as modelregistryRegisteredModelCalculationServiceApi from "../../../.cache/proto/acme/modelregistry/v1/registered_model_calculation_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as personalizationAffinityImportServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as venuesVenueValidationServiceApi from "../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyAffinityImportMessage keeps of each CancelAffinityImport response. */
interface CopyAffinityImportMessageRecord {
  message: string;
  status: string;
  referenceId: string;
}

/** Where copyAffinityImportMessage hands each record. */
interface CopyAffinityImportMessageTarget {
  deliver(record: CopyAffinityImportMessageRecord): Promise<void>;
}

/** Passes records to acme.venues.v1.VenueValidationService. */
class CopyAffinityImportMessageVenueValidation implements CopyAffinityImportMessageTarget {
  private readonly client: venuesVenueValidationServiceApi.VenueValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new venuesVenueValidationServiceApi.VenueValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyAffinityImportMessageRecord): Promise<void> {
    await call<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse>(
      (request, done) => this.client.explainVenueDecision(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      venuesVenueValidationServiceApi.ExplainVenueDecisionRequest.fromPartial({ venueId: record.referenceId, venue: { code: record.message } }));
  }
}

/** Writes records to acme.notifications.v1.NotificationTemplateAdminService. */
class CopyAffinityImportMessageNotificationTemplateAdmin implements CopyAffinityImportMessageTarget {
  private readonly client: notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyAffinityImportMessageRecord): Promise<void> {
    await call<notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateResponse>(
      (request, done) => this.client.restoreNotificationTemplate(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsNotificationTemplateAdminServiceApi.RestoreNotificationTemplateRequest.fromPartial({ notificationTemplateId: record.status }));
  }
}

/** Writes records to acme.modelregistry.v1.RegisteredModelCalculationService. */
class CopyAffinityImportMessageRegisteredModelCalculation implements CopyAffinityImportMessageTarget {
  private readonly client: modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyAffinityImportMessageRecord): Promise<void> {
    await call<modelregistryRegisteredModelCalculationServiceApi.CalculateRegisteredModelRequest, modelregistryRegisteredModelCalculationServiceApi.CalculateRegisteredModelResponse>(
      (request, done) => this.client.calculateRegisteredModel(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      modelregistryRegisteredModelCalculationServiceApi.CalculateRegisteredModelRequest.fromPartial({ registeredModel: { code: record.status } }));
  }
}

/** Passes records to acme.experiments.v1.ExperimentCalculationService. */
class CopyAffinityImportMessageExperimentCalculation implements CopyAffinityImportMessageTarget {
  private readonly client: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CopyAffinityImportMessageRecord): Promise<void> {
    await call<experimentsExperimentCalculationServiceApi.EstimateExperimentRequest, experimentsExperimentCalculationServiceApi.EstimateExperimentResponse>(
      (request, done) => this.client.estimateExperiment(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsExperimentCalculationServiceApi.EstimateExperimentRequest.fromPartial({ experiment: { title: record.message }, reason: record.referenceId, details: { currencyCode: record.status } }));
  }
}

/**
 * Reads acme.personalization.v1.AffinityImportService/CancelAffinityImport and hands what it keeps to the
 * sink of its kind.
 */
export async function copyAffinityImportMessage(runtime: Runtime): Promise<void> {
  const upstream = new personalizationAffinityImportServiceApi.AffinityImportServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<personalizationAffinityImportServiceApi.CancelAffinityImportRequest, personalizationAffinityImportServiceApi.CancelAffinityImportResponse>(
    (request, done) => upstream.cancelAffinityImport(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    personalizationAffinityImportServiceApi.CancelAffinityImportRequest.fromPartial({ reason: "current-copy-affinity-import-message" })));
  const kept: CopyAffinityImportMessageRecord = {
    message: reply.result?.message ?? "",
    status: text.normalize(reply.result?.status ?? ""),
    referenceId: reply.outcome?.referenceId ?? "",
  };
  const entries: Array<{ kind: string; sink: CopyAffinityImportMessageTarget }> = [
    { kind: "venue-validation", sink: new CopyAffinityImportMessageVenueValidation(runtime) },
    { kind: "notification-template-admin", sink: new CopyAffinityImportMessageNotificationTemplateAdmin(runtime) },
    { kind: "registered-model-calculation", sink: new CopyAffinityImportMessageRegisteredModelCalculation(runtime) },
    { kind: "experiment-calculation", sink: new CopyAffinityImportMessageExperimentCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "registered-model-calculation") continue;
    await entry.sink.deliver(kept);
  }
}
