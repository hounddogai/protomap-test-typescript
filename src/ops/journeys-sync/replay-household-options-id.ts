import * as customersHouseholdCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as localizationLocaleQueryServiceApi from "../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as sellersSellerQueryServiceApi from "../../../.cache/proto/acme/sellers/v1/seller_query_service.js";
import * as showsShowQueryServiceApi from "../../../.cache/proto/acme/shows/v1/show_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayHouseholdOptionsId keeps of each CompareHouseholdOptions response. */
interface ReplayHouseholdOptionsIdRecord {
  parentId: string;
  status: string;
  householdId: string;
  currencyCode: string;
}

/** Where replayHouseholdOptionsId hands each record. */
interface ReplayHouseholdOptionsIdSink {
  deliver(record: ReplayHouseholdOptionsIdRecord): Promise<void>;
}

/** Sends records to acme.sellers.v1.SellerQueryService. */
class ReplayHouseholdOptionsIdSellerQuery implements ReplayHouseholdOptionsIdSink {
  private readonly client: sellersSellerQueryServiceApi.SellerQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sellersSellerQueryServiceApi.SellerQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayHouseholdOptionsIdRecord): Promise<void> {
    await call<sellersSellerQueryServiceApi.FindSellersRequest, sellersSellerQueryServiceApi.FindSellersResponse>(
      (request, done) => this.client.findSellers(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      sellersSellerQueryServiceApi.FindSellersRequest.fromPartial({ filter: { query: record.status, region: record.householdId }, page: { pageToken: record.parentId } }));
  }
}

/** Hands records to acme.localization.v1.LocaleQueryService. */
class ReplayHouseholdOptionsIdLocaleQuery implements ReplayHouseholdOptionsIdSink {
  private readonly client: localizationLocaleQueryServiceApi.LocaleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleQueryServiceApi.LocaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayHouseholdOptionsIdRecord): Promise<void> {
    await retry(() => call<localizationLocaleQueryServiceApi.FindLocalesRequest, localizationLocaleQueryServiceApi.FindLocalesResponse>(
      (request, done) => this.client.findLocales(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationLocaleQueryServiceApi.FindLocalesRequest.fromPartial({ filter: { ownerId: record.householdId, region: record.parentId } })));
  }
}

/** Hands records to acme.shows.v1.ShowQueryService. */
class ReplayHouseholdOptionsIdShowQuery implements ReplayHouseholdOptionsIdSink {
  private readonly client: showsShowQueryServiceApi.ShowQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new showsShowQueryServiceApi.ShowQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayHouseholdOptionsIdRecord): Promise<void> {
    await call<showsShowQueryServiceApi.PeekShowRequest, showsShowQueryServiceApi.PeekShowResponse>(
      (request, done) => this.client.peekShow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      showsShowQueryServiceApi.PeekShowRequest.fromPartial({ showId: record.householdId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ReplayHouseholdOptionsIdLogOnly implements ReplayHouseholdOptionsIdSink {
  async deliver(record: ReplayHouseholdOptionsIdRecord): Promise<void> {
    console.info("no sink for record", record.parentId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchReplayHouseholdOptionsId(kind: string, record: ReplayHouseholdOptionsIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: ReplayHouseholdOptionsIdRecord): Promise<void> => new ReplayHouseholdOptionsIdLogOnly().deliver(item);
  switch (kind) {
    case "seller-query":
      write = (item) => new ReplayHouseholdOptionsIdSellerQuery(runtime).deliver(item);
      break;
    case "locale-query":
      write = (item) => new ReplayHouseholdOptionsIdLocaleQuery(runtime).deliver(item);
      break;
    case "show-query":
      write = (item) => new ReplayHouseholdOptionsIdShowQuery(runtime).deliver(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.customers.v1.HouseholdCalculationService/CompareHouseholdOptions and hands what it keeps to the
 * sink of its kind.
 */
export async function replayHouseholdOptionsId(runtime: Runtime): Promise<void> {
  const source = new customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<customersHouseholdCalculationServiceApi.CompareHouseholdOptionsRequest, customersHouseholdCalculationServiceApi.CompareHouseholdOptionsResponse>(
    (request, done) => source.compareHouseholdOptions(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    customersHouseholdCalculationServiceApi.CompareHouseholdOptionsRequest.fromPartial({ reason: "nightly-replay-household-options-id" }));
  const entry: ReplayHouseholdOptionsIdRecord = {
    parentId: text.normalize(found.household?.parentId ?? ""),
    status: found.result?.status ?? "",
    householdId: found.household?.householdId ?? "",
    currencyCode: found.breakdown?.currencyCode ?? "",
  };
  await dispatchReplayHouseholdOptionsId("seller-query", entry, runtime);
}
