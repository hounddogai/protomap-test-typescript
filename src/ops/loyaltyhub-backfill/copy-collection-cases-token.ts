import * as collectionsCollectionCaseQueryServiceApi from "../../../.cache/proto/acme/collections/v1/collection_case_query_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyCollectionCasesToken keeps of each SuggestCollectionCases response. */
interface CopyCollectionCasesTokenRecord {
  nextPageToken: string;
  message: string;
}

/** Where copyCollectionCasesToken hands each record. */
interface CopyCollectionCasesTokenDestination {
  send(record: CopyCollectionCasesTokenRecord): Promise<void>;
}

/** Hands records to acme.localization.v1.LocaleLifecycleService. */
class CopyCollectionCasesTokenLocaleLifecycle implements CopyCollectionCasesTokenDestination {
  private readonly client: localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CopyCollectionCasesTokenRecord): Promise<void> {
    await call<localizationLocaleLifecycleServiceApi.ActivateLocaleRequest, localizationLocaleLifecycleServiceApi.ActivateLocaleResponse>(
      (request, done) => this.client.activateLocale(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationLocaleLifecycleServiceApi.ActivateLocaleRequest.fromPartial({ reason: record.nextPageToken, details: { reasonCode: record.message } }));
  }
}

/**
 * Reads acme.collections.v1.CollectionCaseQueryService/SuggestCollectionCases and hands what it keeps to
 * acme.localization.v1.LocaleLifecycleService.
 */
export async function copyCollectionCasesToken(runtime: Runtime): Promise<void> {
  const reader = new collectionsCollectionCaseQueryServiceApi.CollectionCaseQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<collectionsCollectionCaseQueryServiceApi.SuggestCollectionCasesRequest, collectionsCollectionCaseQueryServiceApi.SuggestCollectionCasesResponse>(
    (request, done) => reader.suggestCollectionCases(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    collectionsCollectionCaseQueryServiceApi.SuggestCollectionCasesRequest.fromPartial({ orderBy: "nightly-copy-collection-cases-token" }));
  const kept: CopyCollectionCasesTokenRecord = {
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
    message: response.result?.message ?? "",
  };
  await new CopyCollectionCasesTokenLocaleLifecycle(runtime).send(kept);
}
