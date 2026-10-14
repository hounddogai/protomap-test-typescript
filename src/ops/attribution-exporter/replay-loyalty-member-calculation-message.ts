import * as loyaltyLoyaltyMemberCalculationServiceApi from "../../../.cache/proto/acme/loyalty/v1/loyalty_member_calculation_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayLoyaltyMemberCalculationMessage keeps of each ExplainLoyaltyMemberCalculation response. */
interface ReplayLoyaltyMemberCalculationMessageRecord {
  message: string;
  referenceId: string;
  loyaltyMemberId: string;
  status: string;
}

/**
 * Reads acme.loyalty.v1.LoyaltyMemberCalculationService/ExplainLoyaltyMemberCalculation, keeps its fields by
 * name, and passes some of them to acme.messaging.v1.ChannelLifecycleService.
 */
export async function replayLoyaltyMemberCalculationMessage(runtime: Runtime): Promise<void> {
  const reader = new loyaltyLoyaltyMemberCalculationServiceApi.LoyaltyMemberCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<loyaltyLoyaltyMemberCalculationServiceApi.ExplainLoyaltyMemberCalculationRequest, loyaltyLoyaltyMemberCalculationServiceApi.ExplainLoyaltyMemberCalculationResponse>(
    (request, done) => reader.explainLoyaltyMemberCalculation(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    loyaltyLoyaltyMemberCalculationServiceApi.ExplainLoyaltyMemberCalculationRequest.fromPartial({ reason: "default-replay-loyalty-member-calculation-message" })));
  const entry: ReplayLoyaltyMemberCalculationMessageRecord = {
    message: current.result?.message ?? "",
    referenceId: text.normalize(current.outcome?.referenceId ?? ""),
    loyaltyMemberId: text.normalize(current.loyaltyMember?.loyaltyMemberId ?? ""),
    status: current.outcome?.status ?? "",
  };
  const slots = new URLSearchParams();
  slots.set("message", entry.message);
  slots.set("reference-id", entry.referenceId);
  slots.set("loyalty-member-id", entry.loyaltyMemberId);
  slots.set("status", entry.status);
  const target = new messagingChannelLifecycleServiceApi.ChannelLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  await call<messagingChannelLifecycleServiceApi.ScheduleChannelExpiryRequest, messagingChannelLifecycleServiceApi.ScheduleChannelExpiryResponse>(
    (request, done) => target.scheduleChannelExpiry(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingChannelLifecycleServiceApi.ScheduleChannelExpiryRequest.fromPartial({ channel: { code: slots.get("loyalty-member-id") ?? "" }, details: { initiatedBy: slots.get("message") ?? "" } }));
}
