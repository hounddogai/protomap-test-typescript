import * as customersPreferenceCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as prescriptionsPrescriptionServiceApi from "../../../.cache/proto/acme/prescriptions/v1/prescription_service.js";
import * as recruitingJobOpeningServiceApi from "../../../.cache/proto/acme/recruiting/v1/job_opening_service.js";
import * as webbffClientSessionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncClientSessionsMessage keeps of each SuggestClientSessions response. */
interface SyncClientSessionsMessageRecord {
  message: string;
  nextPageToken: string;
  correlationId: string;
}

/** Where syncClientSessionsMessage hands each record. */
interface SyncClientSessionsMessageDestination {
  forward(record: SyncClientSessionsMessageRecord): Promise<void>;
}

/** Sends records to acme.prescriptions.v1.PrescriptionService. */
class SyncClientSessionsMessagePrescription implements SyncClientSessionsMessageDestination {
  private readonly client: prescriptionsPrescriptionServiceApi.PrescriptionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new prescriptionsPrescriptionServiceApi.PrescriptionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncClientSessionsMessageRecord): Promise<void> {
    await call<prescriptionsPrescriptionServiceApi.UpdatePrescriptionRequest, prescriptionsPrescriptionServiceApi.UpdatePrescriptionResponse>(
      (request, done) => this.client.updatePrescription(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      prescriptionsPrescriptionServiceApi.UpdatePrescriptionRequest.fromPartial({ prescription: { notes: record.message, number: record.correlationId, prescriptionId: record.nextPageToken } }));
  }
}

/** Sends records to acme.customers.v1.PreferenceCalculationService. */
class SyncClientSessionsMessagePreferenceCalculation implements SyncClientSessionsMessageDestination {
  private readonly client: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncClientSessionsMessageRecord): Promise<void> {
    await call<customersPreferenceCalculationServiceApi.QuotePreferenceRequest, customersPreferenceCalculationServiceApi.QuotePreferenceResponse>(
      (request, done) => this.client.quotePreference(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      customersPreferenceCalculationServiceApi.QuotePreferenceRequest.fromPartial({ details: { currencyCode: record.correlationId }, preference: { description: record.message }, preferenceId: record.nextPageToken }));
  }
}

/** Writes records to acme.recruiting.v1.JobOpeningService. */
class SyncClientSessionsMessageJobOpening implements SyncClientSessionsMessageDestination {
  private readonly client: recruitingJobOpeningServiceApi.JobOpeningServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new recruitingJobOpeningServiceApi.JobOpeningServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncClientSessionsMessageRecord): Promise<void> {
    await call<recruitingJobOpeningServiceApi.CloneJobOpeningRequest, recruitingJobOpeningServiceApi.CloneJobOpeningResponse>(
      (request, done) => this.client.cloneJobOpening(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      recruitingJobOpeningServiceApi.CloneJobOpeningRequest.fromPartial({ jobOpening: { jobOpeningId: record.nextPageToken, notes: record.message, number: record.correlationId } }));
  }
}

/**
 * Reads acme.webbff.v1.ClientSessionQueryService/SuggestClientSessions and hands what it keeps to the sink of
 * its kind.
 */
export async function syncClientSessionsMessage(runtime: Runtime): Promise<void> {
  const reader = new webbffClientSessionQueryServiceApi.ClientSessionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest, webbffClientSessionQueryServiceApi.SuggestClientSessionsResponse>(
    (request, done) => reader.suggestClientSessions(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest.fromPartial({ orderBy: "primary-sync-client-sessions-message" }));
  const row: SyncClientSessionsMessageRecord = {
    message: reply.result?.message ?? "",
    nextPageToken: reply.pageInfo?.nextPageToken ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  const entries: Array<{ kind: string; sink: SyncClientSessionsMessageDestination }> = [
    { kind: "prescription", sink: new SyncClientSessionsMessagePrescription(runtime) },
    { kind: "preference-calculation", sink: new SyncClientSessionsMessagePreferenceCalculation(runtime) },
    { kind: "job-opening", sink: new SyncClientSessionsMessageJobOpening(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "prescription") continue;
    await entry.sink.forward(row);
  }
}
