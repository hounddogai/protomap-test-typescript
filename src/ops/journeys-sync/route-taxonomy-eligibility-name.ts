import * as contentTaxonomyValidationServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as messagingConversationServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeTaxonomyEligibilityName keeps of each CheckTaxonomyEligibility response. */
interface RouteTaxonomyEligibilityNameRecord {
  name: string;
  message: string;
  outcomeMessage: string;
  status: string;
}

/**
 * Reads acme.content.v1.TaxonomyValidationService/CheckTaxonomyEligibility, keeps its fields by name, and
 * passes some of them to acme.messaging.v1.ConversationService.
 */
export async function routeTaxonomyEligibilityName(runtime: Runtime): Promise<void> {
  const reader = new contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest, contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityResponse>(
    (request, done) => reader.checkTaxonomyEligibility(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    contentTaxonomyValidationServiceApi.CheckTaxonomyEligibilityRequest.fromPartial({ taxonomyId: "live-route-taxonomy-eligibility-name" })));
  const kept: RouteTaxonomyEligibilityNameRecord = {
    name: found.taxonomy?.name ?? "",
    message: found.result?.message ?? "",
    outcomeMessage: found.outcome?.message ?? "",
    status: found.outcome?.status ?? "",
  };
  const carried = new Headers();
  carried.set("x-name", kept.name);
  carried.set("x-message", kept.message);
  carried.set("x-outcome-message", kept.outcomeMessage);
  carried.set("x-status", kept.status);
  const downstream = new messagingConversationServiceApi.ConversationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<messagingConversationServiceApi.GetConversationRequest, messagingConversationServiceApi.GetConversationResponse>(
    (request, done) => downstream.getConversation(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingConversationServiceApi.GetConversationRequest.fromPartial({ conversationId: carried.get("x-name") ?? "" }));
}
