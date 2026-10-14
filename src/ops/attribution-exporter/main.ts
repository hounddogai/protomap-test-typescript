/**
 * The attribution-exporter job exporters attribution's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { relayHandoffStatus } from "./relay-handoff-status.js";
import { replayLoyaltyMemberCalculationMessage } from "./replay-loyalty-member-calculation-message.js";
import { pushFormSubmissionsMessage } from "./push-form-submissions-message.js";
import { handOffPolicyOptionsCode } from "./hand-off-policy-options-code.js";
import { routeArticleMessage } from "./route-article-message.js";
import { copyAffinityImportMessage } from "./copy-affinity-import-message.js";
import { syncConversationsMessage } from "./sync-conversations-message.js";
import { exportGetWarehousesStatus } from "./export-get-warehouses-status.js";
import { settleChatMessageStatus } from "./settle-chat-message-status.js";
import { pushRouteOptionsMessage } from "./push-route-options-message.js";
import { settleRecommendationsNotes } from "./settle-recommendations-notes.js";
import { backfillBroadcastMessage } from "./backfill-broadcast-message.js";
import { settleAccessPoliciesToken } from "./settle-access-policies-token.js";
import { syncReturnRequestsId } from "./sync-return-requests-id.js";
import { replaySellerStatus } from "./replay-seller-status.js";
import { relayTicketsMessage } from "./relay-tickets-message.js";
import { replaySurveyNotes } from "./replay-survey-notes.js";
import { replayVenueRulesCode } from "./replay-venue-rules-code.js";
import { exportChatBotsMessage } from "./export-chat-bots-message.js";
import { settleBuildingOptionsStatus } from "./settle-building-options-status.js";

const runtime = connect();
let failed = 0;
try {
  await relayHandoffStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("relay handoff status failed", error);
}
try {
  await replayLoyaltyMemberCalculationMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("replay loyalty member calculation message failed", error);
}
try {
  await pushFormSubmissionsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("push form submissions message failed", error);
}
try {
  await handOffPolicyOptionsCode(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off policy options code failed", error);
}
try {
  await routeArticleMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route article message failed", error);
}
try {
  await copyAffinityImportMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("copy affinity import message failed", error);
}
try {
  await syncConversationsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("sync conversations message failed", error);
}
try {
  await exportGetWarehousesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("export get warehouses status failed", error);
}
try {
  await settleChatMessageStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("settle chat message status failed", error);
}
try {
  await pushRouteOptionsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("push route options message failed", error);
}
try {
  await settleRecommendationsNotes(runtime);
} catch (error) {
  failed += 1;
  console.error("settle recommendations notes failed", error);
}
try {
  await backfillBroadcastMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill broadcast message failed", error);
}
try {
  await settleAccessPoliciesToken(runtime);
} catch (error) {
  failed += 1;
  console.error("settle access policies token failed", error);
}
try {
  await syncReturnRequestsId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync return requests id failed", error);
}
try {
  await replaySellerStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("replay seller status failed", error);
}
try {
  await relayTicketsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("relay tickets message failed", error);
}
try {
  await replaySurveyNotes(runtime);
} catch (error) {
  failed += 1;
  console.error("replay survey notes failed", error);
}
try {
  await replayVenueRulesCode(runtime);
} catch (error) {
  failed += 1;
  console.error("replay venue rules code failed", error);
}
try {
  await exportChatBotsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("export chat bots message failed", error);
}
try {
  await settleBuildingOptionsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("settle building options status failed", error);
}
if (failed > 0) process.exit(1);
