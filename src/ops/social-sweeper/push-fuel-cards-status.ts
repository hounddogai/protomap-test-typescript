import * as contentContentRevisionCalculationServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as fuelFuelCardServiceApi from "../../../.cache/proto/acme/fuel/v1/fuel_card_service.js";
import * as venuesVenueServiceApi from "../../../.cache/proto/acme/venues/v1/venue_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushFuelCardsStatus keeps of each ListFuelCards response. */
interface PushFuelCardsStatusRecord {
  status: string;
  nextPageToken: string;
  correlationId: string;
}

/** Where pushFuelCardsStatus hands each record. */
interface PushFuelCardsStatusDestination {
  write(record: PushFuelCardsStatusRecord): Promise<void>;
}

/** Passes records to acme.content.v1.ContentRevisionCalculationService. */
class PushFuelCardsStatusContentRevisionCalculation implements PushFuelCardsStatusDestination {
  private readonly client: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushFuelCardsStatusRecord): Promise<void> {
    await retry(() => call<contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest, contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsResponse>(
      (request, done) => this.client.recalculateContentRevisions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      contentContentRevisionCalculationServiceApi.RecalculateContentRevisionsRequest.fromPartial({ contentRevision: { kind: record.status } })));
  }
}

/** Hands records to acme.venues.v1.VenueService. */
class PushFuelCardsStatusVenue implements PushFuelCardsStatusDestination {
  private readonly client: venuesVenueServiceApi.VenueServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new venuesVenueServiceApi.VenueServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushFuelCardsStatusRecord): Promise<void> {
    await call<venuesVenueServiceApi.CloneVenueRequest, venuesVenueServiceApi.CloneVenueResponse>(
      (request, done) => this.client.cloneVenue(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      venuesVenueServiceApi.CloneVenueRequest.fromPartial({ venue: { venueId: record.correlationId, code: record.status }, requestId: record.nextPageToken }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PushFuelCardsStatusLogOnly implements PushFuelCardsStatusDestination {
  async write(record: PushFuelCardsStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPushFuelCardsStatus(kind: string, record: PushFuelCardsStatusRecord, runtime: Runtime): Promise<void> {
  let sink: PushFuelCardsStatusDestination = new PushFuelCardsStatusLogOnly();
  switch (kind) {
    case "content-revision-calculation":
      sink = new PushFuelCardsStatusContentRevisionCalculation(runtime);
      break;
    case "venue":
      sink = new PushFuelCardsStatusVenue(runtime);
      break;
  }
  await sink.write(record);
}

/** Reads acme.fuel.v1.FuelCardService/ListFuelCards and hands what it keeps to the sink of its kind. */
export async function pushFuelCardsStatus(runtime: Runtime): Promise<void> {
  const source = new fuelFuelCardServiceApi.FuelCardServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<fuelFuelCardServiceApi.ListFuelCardsRequest, fuelFuelCardServiceApi.ListFuelCardsResponse>(
    (request, done) => source.listFuelCards(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    fuelFuelCardServiceApi.ListFuelCardsRequest.fromPartial({ orderBy: "nightly-push-fuel-cards-status" }));
  const entry: PushFuelCardsStatusRecord = {
    status: response.result?.status ?? "",
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  await deliverPushFuelCardsStatus("venue", entry, runtime);
}
