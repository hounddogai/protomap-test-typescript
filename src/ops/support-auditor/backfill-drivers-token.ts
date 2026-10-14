import * as accountingChartOfAccountsQueryServiceApi from "../../../.cache/proto/acme/accounting/v1/chart_of_accounts_query_service.js";
import * as driversDriverQueryServiceApi from "../../../.cache/proto/acme/drivers/v1/driver_query_service.js";
import * as personalizationAffinityLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillDriversToken keeps of each ResolveDrivers response. */
interface BackfillDriversTokenRecord {
  nextPageToken: string;
  message: string;
}

/** Where backfillDriversToken hands each record. */
interface BackfillDriversTokenSink {
  push(record: BackfillDriversTokenRecord): Promise<void>;
}

/** Sends records to acme.personalization.v1.AffinityLifecycleService. */
class BackfillDriversTokenAffinityLifecycle implements BackfillDriversTokenSink {
  private readonly client: personalizationAffinityLifecycleServiceApi.AffinityLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityLifecycleServiceApi.AffinityLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillDriversTokenRecord): Promise<void> {
    await call<personalizationAffinityLifecycleServiceApi.ExpireAffinityRequest, personalizationAffinityLifecycleServiceApi.ExpireAffinityResponse>(
      (request, done) => this.client.expireAffinity(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      personalizationAffinityLifecycleServiceApi.ExpireAffinityRequest.fromPartial({ affinityId: record.nextPageToken, reason: record.message }));
  }
}

/** Sends records to acme.accounting.v1.ChartOfAccountsQueryService. */
class BackfillDriversTokenChartOfAccountsQuery implements BackfillDriversTokenSink {
  private readonly client: accountingChartOfAccountsQueryServiceApi.ChartOfAccountsQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new accountingChartOfAccountsQueryServiceApi.ChartOfAccountsQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: BackfillDriversTokenRecord): Promise<void> {
    await call<accountingChartOfAccountsQueryServiceApi.CountChartOfAccountsesRequest, accountingChartOfAccountsQueryServiceApi.CountChartOfAccountsesResponse>(
      (request, done) => this.client.countChartOfAccountses(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      accountingChartOfAccountsQueryServiceApi.CountChartOfAccountsesRequest.fromPartial({ page: { pageToken: record.message }, filter: { query: record.nextPageToken } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class BackfillDriversTokenLogOnly implements BackfillDriversTokenSink {
  async push(record: BackfillDriversTokenRecord): Promise<void> {
    console.info("no sink for record", record.nextPageToken);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverBackfillDriversToken(kind: string, record: BackfillDriversTokenRecord, runtime: Runtime): Promise<void> {
  let sink: BackfillDriversTokenSink = new BackfillDriversTokenLogOnly();
  switch (kind) {
    case "affinity-lifecycle":
      sink = new BackfillDriversTokenAffinityLifecycle(runtime);
      break;
    case "chart-of-accounts-query":
      sink = new BackfillDriversTokenChartOfAccountsQuery(runtime);
      break;
  }
  await sink.push(record);
}

/** Reads acme.drivers.v1.DriverQueryService/ResolveDrivers and hands what it keeps to the sink of its kind. */
export async function backfillDriversToken(runtime: Runtime): Promise<void> {
  const origin = new driversDriverQueryServiceApi.DriverQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<driversDriverQueryServiceApi.ResolveDriversRequest, driversDriverQueryServiceApi.ResolveDriversResponse>(
    (request, done) => origin.resolveDrivers(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    driversDriverQueryServiceApi.ResolveDriversRequest.fromPartial({}));
  const kept: BackfillDriversTokenRecord = {
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
    message: found.result?.message ?? "",
  };
  await deliverBackfillDriversToken("affinity-lifecycle", kept, runtime);
}
