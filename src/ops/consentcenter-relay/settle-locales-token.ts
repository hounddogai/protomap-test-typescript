import * as catalogProductQueryServiceApi from "../../../.cache/proto/acme/catalog/v1/product_query_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as localizationLocaleQueryServiceApi from "../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as webbffWidgetLayoutServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleLocalesToken keeps of each SuggestLocales response. */
interface SettleLocalesTokenRecord {
  nextPageToken: string;
  message: string;
}

/** Where settleLocalesToken hands each record. */
interface SettleLocalesTokenTarget {
  write(record: SettleLocalesTokenRecord): Promise<void>;
}

/** Passes records to acme.featureflags.v1.FeatureFlagQueryService. */
class SettleLocalesTokenFeatureFlagQuery implements SettleLocalesTokenTarget {
  private readonly client: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SettleLocalesTokenRecord): Promise<void> {
    await call<featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsResponse>(
      (request, done) => this.client.suggestFeatureFlags(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      featureflagsFeatureFlagQueryServiceApi.SuggestFeatureFlagsRequest.fromPartial({ filter: { ownerId: record.nextPageToken } }));
  }
}

/** Writes records to acme.webbff.v1.WidgetLayoutService. */
class SettleLocalesTokenWidgetLayout implements SettleLocalesTokenTarget {
  private readonly client: webbffWidgetLayoutServiceApi.WidgetLayoutServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffWidgetLayoutServiceApi.WidgetLayoutServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SettleLocalesTokenRecord): Promise<void> {
    await call<webbffWidgetLayoutServiceApi.SearchWidgetLayoutsRequest, webbffWidgetLayoutServiceApi.SearchWidgetLayoutsResponse>(
      (request, done) => this.client.searchWidgetLayouts(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webbffWidgetLayoutServiceApi.SearchWidgetLayoutsRequest.fromPartial({ page: { pageToken: record.message }, filter: { ownerId: record.nextPageToken } }));
  }
}

/** Sends records to acme.catalog.v1.ProductQueryService. */
class SettleLocalesTokenProductQuery implements SettleLocalesTokenTarget {
  private readonly client: catalogProductQueryServiceApi.ProductQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new catalogProductQueryServiceApi.ProductQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SettleLocalesTokenRecord): Promise<void> {
    await retry(() => call<catalogProductQueryServiceApi.SuggestProductsRequest, catalogProductQueryServiceApi.SuggestProductsResponse>(
      (request, done) => this.client.suggestProducts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      catalogProductQueryServiceApi.SuggestProductsRequest.fromPartial({ filter: { ownerId: record.message }, orderBy: record.nextPageToken })));
  }
}

/** Only logs, for kinds no service takes yet. */
class SettleLocalesTokenLogOnly implements SettleLocalesTokenTarget {
  async write(record: SettleLocalesTokenRecord): Promise<void> {
    console.info("no sink for record", record.nextPageToken);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverSettleLocalesToken(kind: string, record: SettleLocalesTokenRecord, runtime: Runtime): Promise<void> {
  let sink: SettleLocalesTokenTarget = new SettleLocalesTokenLogOnly();
  switch (kind) {
    case "feature-flag-query":
      sink = new SettleLocalesTokenFeatureFlagQuery(runtime);
      break;
    case "widget-layout":
      sink = new SettleLocalesTokenWidgetLayout(runtime);
      break;
    case "product-query":
      sink = new SettleLocalesTokenProductQuery(runtime);
      break;
  }
  await sink.write(record);
}

/** Reads acme.localization.v1.LocaleQueryService/SuggestLocales and hands what it keeps to the sink of its kind. */
export async function settleLocalesToken(runtime: Runtime): Promise<void> {
  const origin = new localizationLocaleQueryServiceApi.LocaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<localizationLocaleQueryServiceApi.SuggestLocalesRequest, localizationLocaleQueryServiceApi.SuggestLocalesResponse>(
    (request, done) => origin.suggestLocales(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    localizationLocaleQueryServiceApi.SuggestLocalesRequest.fromPartial({ orderBy: "main-settle-locales-token" })));
  const record: SettleLocalesTokenRecord = {
    nextPageToken: text.normalize(response.pageInfo?.nextPageToken ?? ""),
    message: response.result?.message ?? "",
  };
  await deliverSettleLocalesToken("product-query", record, runtime);
}
