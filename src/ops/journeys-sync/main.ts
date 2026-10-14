/**
 * The journeys-sync job syncs journeys's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { propagateTaxonomyCalculationStatus } from "./propagate-taxonomy-calculation-status.js";
import { copyGiftCardRatesStatus } from "./copy-gift-card-rates-status.js";
import { copyLineageNodeCalculationId } from "./copy-lineage-node-calculation-id.js";
import { pushBudgetsToken } from "./push-budgets-token.js";
import { settleChatRoomApprovalId } from "./settle-chat-room-approval-id.js";
import { syncSearchIndexMessage } from "./sync-search-index-message.js";
import { carryFuelCardCode } from "./carry-fuel-card-code.js";
import { carrySecretStatus } from "./carry-secret-status.js";
import { backfillVideoVisitTitle } from "./backfill-video-visit-title.js";
import { propagateClientSessionsMessage } from "./propagate-client-sessions-message.js";
import { replayHouseholdOptionsId } from "./replay-household-options-id.js";
import { handOffCampaignBudgetWorkflowStatus } from "./hand-off-campaign-budget-workflow-status.js";
import { backfillWorkOrderStatus } from "./backfill-work-order-status.js";
import { replayFormFieldApprovalDescription } from "./replay-form-field-approval-description.js";
import { backfillShowRatesTitle } from "./backfill-show-rates-title.js";
import { relayTranslationKeyWorkflowId } from "./relay-translation-key-workflow-id.js";
import { routeNotificationTemplateNotes } from "./route-notification-template-notes.js";
import { relayUsersStatus } from "./relay-users-status.js";
import { replayForumMessage } from "./replay-forum-message.js";
import { handOffNotificationStatus } from "./hand-off-notification-status.js";
import { backfillOrderId } from "./backfill-order-id.js";
import { propagateChatRoomRulesStatus } from "./propagate-chat-room-rules-status.js";
import { replaySellersMessage } from "./replay-sellers-message.js";
import { relayArticleWorkflowId } from "./relay-article-workflow-id.js";
import { carryFixedAssetsCode } from "./carry-fixed-assets-code.js";
import { routeTaxonomyEligibilityName } from "./route-taxonomy-eligibility-name.js";
import { routeParticipantId } from "./route-participant-id.js";
import { settleExperimentId } from "./settle-experiment-id.js";
import { mirrorTelemetryReadingSource } from "./mirror-telemetry-reading-source.js";

const runtime = connect();
let failed = 0;
try {
  await propagateTaxonomyCalculationStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate taxonomy calculation status failed", error);
}
try {
  await copyGiftCardRatesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("copy gift card rates status failed", error);
}
try {
  await copyLineageNodeCalculationId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy lineage node calculation id failed", error);
}
try {
  await pushBudgetsToken(runtime);
} catch (error) {
  failed += 1;
  console.error("push budgets token failed", error);
}
try {
  await settleChatRoomApprovalId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle chat room approval id failed", error);
}
try {
  await syncSearchIndexMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("sync search index message failed", error);
}
try {
  await carryFuelCardCode(runtime);
} catch (error) {
  failed += 1;
  console.error("carry fuel card code failed", error);
}
try {
  await carrySecretStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry secret status failed", error);
}
try {
  await backfillVideoVisitTitle(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill video visit title failed", error);
}
try {
  await propagateClientSessionsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate client sessions message failed", error);
}
try {
  await replayHouseholdOptionsId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay household options id failed", error);
}
try {
  await handOffCampaignBudgetWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off campaign budget workflow status failed", error);
}
try {
  await backfillWorkOrderStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill work order status failed", error);
}
try {
  await replayFormFieldApprovalDescription(runtime);
} catch (error) {
  failed += 1;
  console.error("replay form field approval description failed", error);
}
try {
  await backfillShowRatesTitle(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill show rates title failed", error);
}
try {
  await relayTranslationKeyWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("relay translation key workflow id failed", error);
}
try {
  await routeNotificationTemplateNotes(runtime);
} catch (error) {
  failed += 1;
  console.error("route notification template notes failed", error);
}
try {
  await relayUsersStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("relay users status failed", error);
}
try {
  await replayForumMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("replay forum message failed", error);
}
try {
  await handOffNotificationStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off notification status failed", error);
}
try {
  await backfillOrderId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill order id failed", error);
}
try {
  await propagateChatRoomRulesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate chat room rules status failed", error);
}
try {
  await replaySellersMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("replay sellers message failed", error);
}
try {
  await relayArticleWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("relay article workflow id failed", error);
}
try {
  await carryFixedAssetsCode(runtime);
} catch (error) {
  failed += 1;
  console.error("carry fixed assets code failed", error);
}
try {
  await routeTaxonomyEligibilityName(runtime);
} catch (error) {
  failed += 1;
  console.error("route taxonomy eligibility name failed", error);
}
try {
  await routeParticipantId(runtime);
} catch (error) {
  failed += 1;
  console.error("route participant id failed", error);
}
try {
  await settleExperimentId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle experiment id failed", error);
}
try {
  await mirrorTelemetryReadingSource(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror telemetry reading source failed", error);
}
if (failed > 0) process.exit(1);
