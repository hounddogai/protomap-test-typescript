/**
 * The referral-publisher job publishers referral's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { replayParticipantId } from "./replay-participant-id.js";
import { settleLocaleName } from "./settle-locale-name.js";
import { exportPageCompositionsToken } from "./export-page-compositions-token.js";
import { handOffClientSessionConnectionSubject } from "./hand-off-client-session-connection-subject.js";
import { relayConversationId } from "./relay-conversation-id.js";
import { settleFormFieldLifecycleId } from "./settle-form-field-lifecycle-id.js";
import { exportGetProfilesMessage } from "./export-get-profiles-message.js";
import { carryToursId } from "./carry-tours-id.js";
import { propagateParticipantImportsMessage } from "./propagate-participant-imports-message.js";
import { routeAffinityMessage } from "./route-affinity-message.js";
import { propagateNotificationVersionStatus } from "./propagate-notification-version-status.js";
import { routePatientMessage } from "./route-patient-message.js";
import { relayStockItemId } from "./relay-stock-item-id.js";
import { settleVariantReportsStatus } from "./settle-variant-reports-status.js";
import { propagateLabelingTasksMessage } from "./propagate-labeling-tasks-message.js";
import { forwardSearchIndexesStatus } from "./forward-search-indexes-status.js";
import { forwardChatBotLifecycleName } from "./forward-chat-bot-lifecycle-name.js";
import { backfillConversationLifecycleId } from "./backfill-conversation-lifecycle-id.js";

const runtime = connect();
let failed = 0;
try {
  await replayParticipantId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay participant id failed", error);
}
try {
  await settleLocaleName(runtime);
} catch (error) {
  failed += 1;
  console.error("settle locale name failed", error);
}
try {
  await exportPageCompositionsToken(runtime);
} catch (error) {
  failed += 1;
  console.error("export page compositions token failed", error);
}
try {
  await handOffClientSessionConnectionSubject(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off client session connection subject failed", error);
}
try {
  await relayConversationId(runtime);
} catch (error) {
  failed += 1;
  console.error("relay conversation id failed", error);
}
try {
  await settleFormFieldLifecycleId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle form field lifecycle id failed", error);
}
try {
  await exportGetProfilesMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("export get profiles message failed", error);
}
try {
  await carryToursId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry tours id failed", error);
}
try {
  await propagateParticipantImportsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate participant imports message failed", error);
}
try {
  await routeAffinityMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route affinity message failed", error);
}
try {
  await propagateNotificationVersionStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate notification version status failed", error);
}
try {
  await routePatientMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route patient message failed", error);
}
try {
  await relayStockItemId(runtime);
} catch (error) {
  failed += 1;
  console.error("relay stock item id failed", error);
}
try {
  await settleVariantReportsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("settle variant reports status failed", error);
}
try {
  await propagateLabelingTasksMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate labeling tasks message failed", error);
}
try {
  await forwardSearchIndexesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("forward search indexes status failed", error);
}
try {
  await forwardChatBotLifecycleName(runtime);
} catch (error) {
  failed += 1;
  console.error("forward chat bot lifecycle name failed", error);
}
try {
  await backfillConversationLifecycleId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill conversation lifecycle id failed", error);
}
if (failed > 0) process.exit(1);
