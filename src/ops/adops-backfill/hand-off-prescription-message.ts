import * as audiencesAudienceWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as localizationTranslationJobReportingServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_reporting_service.js";
import * as prescriptionsPrescriptionQueryServiceApi from "../../../.cache/proto/acme/prescriptions/v1/prescription_query_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffPrescriptionMessage keeps of each LookupPrescription response. */
interface HandOffPrescriptionMessageRecord {
  message: string;
  status: string;
  correlationId: string;
  number: string;
}

/** Where handOffPrescriptionMessage hands each record. */
interface HandOffPrescriptionMessageTarget {
  push(record: HandOffPrescriptionMessageRecord): Promise<void>;
}

/** Passes records to acme.localization.v1.TranslationJobReportingService. */
class HandOffPrescriptionMessageTranslationJobReporting implements HandOffPrescriptionMessageTarget {
  private readonly client: localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobReportingServiceApi.TranslationJobReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffPrescriptionMessageRecord): Promise<void> {
    await call<localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsRequest, localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsResponse>(
      (request, done) => this.client.countTranslationJobTotals(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationTranslationJobReportingServiceApi.CountTranslationJobTotalsRequest.fromPartial({ filter: { region: record.status } }));
  }
}

/** Passes records to acme.webbff.v1.WidgetLayoutNotificationService. */
class HandOffPrescriptionMessageWidgetLayoutNotification implements HandOffPrescriptionMessageTarget {
  private readonly client: webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffPrescriptionMessageRecord): Promise<void> {
    await call<webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesRequest, webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesResponse>(
      (request, done) => this.client.subscribeWidgetLayoutUpdates(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webbffWidgetLayoutNotificationServiceApi.SubscribeWidgetLayoutUpdatesRequest.fromPartial({ details: { templateId: record.correlationId }, reason: record.message }));
  }
}

/** Hands records to acme.audiences.v1.AudienceWorkflowService. */
class HandOffPrescriptionMessageAudienceWorkflow implements HandOffPrescriptionMessageTarget {
  private readonly client: audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffPrescriptionMessageRecord): Promise<void> {
    await retry(() => call<audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowResponse>(
      (request, done) => this.client.startAudienceWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      audiencesAudienceWorkflowServiceApi.StartAudienceWorkflowRequest.fromPartial({ details: { step: record.number } })));
  }
}

/** Runs the action registered for kind. */
async function actOnHandOffPrescriptionMessage(kind: string, record: HandOffPrescriptionMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "translation-job-reporting": () => new HandOffPrescriptionMessageTranslationJobReporting(runtime).push(record),
    "widget-layout-notification": () => new HandOffPrescriptionMessageWidgetLayoutNotification(runtime).push(record),
    "audience-workflow": () => new HandOffPrescriptionMessageAudienceWorkflow(runtime).push(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.prescriptions.v1.PrescriptionQueryService/LookupPrescription and hands what it keeps to the sink
 * of its kind.
 */
export async function handOffPrescriptionMessage(runtime: Runtime): Promise<void> {
  const upstream = new prescriptionsPrescriptionQueryServiceApi.PrescriptionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<prescriptionsPrescriptionQueryServiceApi.LookupPrescriptionRequest, prescriptionsPrescriptionQueryServiceApi.LookupPrescriptionResponse>(
    (request, done) => upstream.lookupPrescription(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    prescriptionsPrescriptionQueryServiceApi.LookupPrescriptionRequest.fromPartial({ prescriptionId: "live-hand-off-prescription-message" })));
  const record: HandOffPrescriptionMessageRecord = {
    message: text.normalize(found.result?.message ?? ""),
    status: found.result?.status ?? "",
    correlationId: text.normalize(found.result?.correlationId ?? ""),
    number: found.prescription?.number ?? "",
  };
  await actOnHandOffPrescriptionMessage("widget-layout-notification", record, runtime);
}
