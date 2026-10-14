import * as cartCartCalculationServiceApi from "../../../.cache/proto/acme/cart/v1/cart_calculation_service.js";
import * as messagingConversationLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateConversationExpiryStatus keeps of each ScheduleConversationExpiry response. */
interface PropagateConversationExpiryStatusRecord {
  status: string;
  message: string;
  referenceId: string;
  conversationId: string;
}

/**
 * Reads acme.messaging.v1.ConversationLifecycleService/ScheduleConversationExpiry, keeps its fields by name,
 * and passes some of them to acme.cart.v1.CartCalculationService.
 */
export async function propagateConversationExpiryStatus(runtime: Runtime): Promise<void> {
  const source = new messagingConversationLifecycleServiceApi.ConversationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest, messagingConversationLifecycleServiceApi.ScheduleConversationExpiryResponse>(
    (request, done) => source.scheduleConversationExpiry(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    messagingConversationLifecycleServiceApi.ScheduleConversationExpiryRequest.fromPartial({ conversationId: "main-propagate-conversation-expiry-status" }));
  const kept: PropagateConversationExpiryStatusRecord = {
    status: reply.result?.status ?? "",
    message: text.normalize(reply.outcome?.message ?? ""),
    referenceId: reply.outcome?.referenceId ?? "",
    conversationId: text.normalize(reply.conversation?.conversationId ?? ""),
  };
  const slots = new URLSearchParams();
  slots.set("status", kept.status);
  slots.set("message", kept.message);
  slots.set("reference-id", kept.referenceId);
  slots.set("conversation-id", kept.conversationId);
  const downstream = new cartCartCalculationServiceApi.CartCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<cartCartCalculationServiceApi.ExplainCartCalculationRequest, cartCartCalculationServiceApi.ExplainCartCalculationResponse>(
    (request, done) => downstream.explainCartCalculation(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    cartCartCalculationServiceApi.ExplainCartCalculationRequest.fromPartial({ cartId: slots.get("reference-id") ?? "", cart: { cartId: slots.get("conversation-id") ?? "" } }));
}
