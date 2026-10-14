import * as customersConsentRecordValidationServiceApi from "../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as searchSearchIndexServiceApi from "../../../.cache/proto/acme/search/v1/search_index_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carrySearchIndexMessage keeps of each GetSearchIndex response. */
interface CarrySearchIndexMessageRecord {
  message: string;
  status: string;
  searchIndexId: string;
  name: string;
}

/**
 * Reads acme.search.v1.SearchIndexService/GetSearchIndex, keeps its fields by name, and passes some of them
 * to acme.customers.v1.ConsentRecordValidationService.
 */
export async function carrySearchIndexMessage(runtime: Runtime): Promise<void> {
  const upstream = new searchSearchIndexServiceApi.SearchIndexServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<searchSearchIndexServiceApi.GetSearchIndexRequest, searchSearchIndexServiceApi.GetSearchIndexResponse>(
    (request, done) => upstream.getSearchIndex(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    searchSearchIndexServiceApi.GetSearchIndexRequest.fromPartial({ searchIndexId: "main-carry-search-index-message" }));
  const entry: CarrySearchIndexMessageRecord = {
    message: reply.result?.message ?? "",
    status: text.normalize(reply.result?.status ?? ""),
    searchIndexId: text.normalize(reply.searchIndex?.searchIndexId ?? ""),
    name: reply.searchIndex?.name ?? "",
  };
  const fields = new URLSearchParams();
  fields.set("message", entry.message);
  fields.set("status", entry.status);
  fields.set("search-index-id", entry.searchIndexId);
  fields.set("name", entry.name);
  const target = new customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<customersConsentRecordValidationServiceApi.GetConsentRecordRulesRequest, customersConsentRecordValidationServiceApi.GetConsentRecordRulesResponse>(
    (request, done) => target.getConsentRecordRules(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    customersConsentRecordValidationServiceApi.GetConsentRecordRulesRequest.fromPartial({ consentRecordId: fields.get("name") ?? "" })));
}
