import * as contentContentRevisionCalculationServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as helpdeskTicketCalculationServiceApi from "../../../.cache/proto/acme/helpdesk/v1/ticket_calculation_service.js";
import * as personalizationProfileQueryServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as telematicsTelemetryReadingQueryServiceApi from "../../../.cache/proto/acme/telematics/v1/telemetry_reading_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateTelemetryReadingsUri keeps of each SummarizeTelemetryReadings response. */
interface PropagateTelemetryReadingsUriRecord {
  downloadUri: string;
  status: string;
  correlationId: string;
  reportId: string;
}

/** Where propagateTelemetryReadingsUri hands each record. */
interface PropagateTelemetryReadingsUriSink {
  write(record: PropagateTelemetryReadingsUriRecord): Promise<void>;
}

/** Writes records to acme.content.v1.ContentRevisionCalculationService. */
class PropagateTelemetryReadingsUriContentRevisionCalculation implements PropagateTelemetryReadingsUriSink {
  private readonly client: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateTelemetryReadingsUriRecord): Promise<void> {
    await retry(() => call<contentContentRevisionCalculationServiceApi.EstimateContentRevisionRequest, contentContentRevisionCalculationServiceApi.EstimateContentRevisionResponse>(
      (request, done) => this.client.estimateContentRevision(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentContentRevisionCalculationServiceApi.EstimateContentRevisionRequest.fromPartial({ reason: record.reportId })));
  }
}

/** Sends records to acme.personalization.v1.ProfileQueryService. */
class PropagateTelemetryReadingsUriProfileQuery implements PropagateTelemetryReadingsUriSink {
  private readonly client: personalizationProfileQueryServiceApi.ProfileQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileQueryServiceApi.ProfileQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateTelemetryReadingsUriRecord): Promise<void> {
    await call<personalizationProfileQueryServiceApi.LookupProfileRequest, personalizationProfileQueryServiceApi.LookupProfileResponse>(
      (request, done) => this.client.lookupProfile(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationProfileQueryServiceApi.LookupProfileRequest.fromPartial({ profileId: record.correlationId }));
  }
}

/** Sends records to acme.helpdesk.v1.TicketCalculationService. */
class PropagateTelemetryReadingsUriTicketCalculation implements PropagateTelemetryReadingsUriSink {
  private readonly client: helpdeskTicketCalculationServiceApi.TicketCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new helpdeskTicketCalculationServiceApi.TicketCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateTelemetryReadingsUriRecord): Promise<void> {
    await retry(() => call<helpdeskTicketCalculationServiceApi.SimulateTicketRequest, helpdeskTicketCalculationServiceApi.SimulateTicketResponse>(
      (request, done) => this.client.simulateTicket(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      helpdeskTicketCalculationServiceApi.SimulateTicketRequest.fromPartial({ reason: record.correlationId })));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateTelemetryReadingsUriLogOnly implements PropagateTelemetryReadingsUriSink {
  async write(record: PropagateTelemetryReadingsUriRecord): Promise<void> {
    console.info("no sink for record", record.downloadUri);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchPropagateTelemetryReadingsUri(kind: string, record: PropagateTelemetryReadingsUriRecord, runtime: Runtime): Promise<void> {
  let write = (item: PropagateTelemetryReadingsUriRecord): Promise<void> => new PropagateTelemetryReadingsUriLogOnly().write(item);
  switch (kind) {
    case "content-revision-calculation":
      write = (item) => new PropagateTelemetryReadingsUriContentRevisionCalculation(runtime).write(item);
      break;
    case "profile-query":
      write = (item) => new PropagateTelemetryReadingsUriProfileQuery(runtime).write(item);
      break;
    case "ticket-calculation":
      write = (item) => new PropagateTelemetryReadingsUriTicketCalculation(runtime).write(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.telematics.v1.TelemetryReadingQueryService/SummarizeTelemetryReadings and hands what it keeps to
 * the sink of its kind.
 */
export async function propagateTelemetryReadingsUri(runtime: Runtime): Promise<void> {
  const upstream = new telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<telematicsTelemetryReadingQueryServiceApi.SummarizeTelemetryReadingsRequest, telematicsTelemetryReadingQueryServiceApi.SummarizeTelemetryReadingsResponse>(
    (request, done) => upstream.summarizeTelemetryReadings(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    telematicsTelemetryReadingQueryServiceApi.SummarizeTelemetryReadingsRequest.fromPartial({ telemetryReadingId: "nightly-propagate-telemetry-readings-uri" }));
  const record: PropagateTelemetryReadingsUriRecord = {
    downloadUri: reply.downloadUri,
    status: reply.result?.status ?? "",
    correlationId: reply.result?.correlationId ?? "",
    reportId: reply.reportId,
  };
  await dispatchPropagateTelemetryReadingsUri("profile-query", record, runtime);
}
