/**
 * The journeys-importer job importers journeys's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { handOffDriverHomesId } from "./hand-off-driver-homes-id.js";
import { carrySecretCode } from "./carry-secret-code.js";
import { propagateTelemetryReadingsUri } from "./propagate-telemetry-readings-uri.js";
import { replayVideoVisitMessage } from "./replay-video-visit-message.js";
import { copyWarehousesStatus } from "./copy-warehouses-status.js";
import { carryPurchaseRequisitionStatus } from "./carry-purchase-requisition-status.js";
import { syncSubscriptionVersionsStatus } from "./sync-subscription-versions-status.js";
import { syncPipelineStatus } from "./sync-pipeline-status.js";
import { settlePatientId } from "./settle-patient-id.js";
import { syncClientSessionUpdatesStatus } from "./sync-client-session-updates-status.js";
import { mirrorChatMessageReportMessage } from "./mirror-chat-message-report-message.js";
import { backfillProfileStatus } from "./backfill-profile-status.js";
import { copyConversationsSubject } from "./copy-conversations-subject.js";
import { exportRenditionCode } from "./export-rendition-code.js";
import { mirrorDriverId } from "./mirror-driver-id.js";
import { carryDriverHomeMessage } from "./carry-driver-home-message.js";
import { propagateBudgetMessage } from "./propagate-budget-message.js";
import { forwardSubscriptionWatchersStatus } from "./forward-subscription-watchers-status.js";
import { syncCartId } from "./sync-cart-id.js";
import { mirrorRenditionsMessage } from "./mirror-renditions-message.js";
import { backfillChatBotDecisionDescription } from "./backfill-chat-bot-decision-description.js";
import { mirrorFormId } from "./mirror-form-id.js";

const runtime = connect();
let failed = 0;
try {
  await handOffDriverHomesId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off driver homes id failed", error);
}
try {
  await carrySecretCode(runtime);
} catch (error) {
  failed += 1;
  console.error("carry secret code failed", error);
}
try {
  await propagateTelemetryReadingsUri(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate telemetry readings uri failed", error);
}
try {
  await replayVideoVisitMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("replay video visit message failed", error);
}
try {
  await copyWarehousesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("copy warehouses status failed", error);
}
try {
  await carryPurchaseRequisitionStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry purchase requisition status failed", error);
}
try {
  await syncSubscriptionVersionsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("sync subscription versions status failed", error);
}
try {
  await syncPipelineStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("sync pipeline status failed", error);
}
try {
  await settlePatientId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle patient id failed", error);
}
try {
  await syncClientSessionUpdatesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("sync client session updates status failed", error);
}
try {
  await mirrorChatMessageReportMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror chat message report message failed", error);
}
try {
  await backfillProfileStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill profile status failed", error);
}
try {
  await copyConversationsSubject(runtime);
} catch (error) {
  failed += 1;
  console.error("copy conversations subject failed", error);
}
try {
  await exportRenditionCode(runtime);
} catch (error) {
  failed += 1;
  console.error("export rendition code failed", error);
}
try {
  await mirrorDriverId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror driver id failed", error);
}
try {
  await carryDriverHomeMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry driver home message failed", error);
}
try {
  await propagateBudgetMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate budget message failed", error);
}
try {
  await forwardSubscriptionWatchersStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("forward subscription watchers status failed", error);
}
try {
  await syncCartId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync cart id failed", error);
}
try {
  await mirrorRenditionsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror renditions message failed", error);
}
try {
  await backfillChatBotDecisionDescription(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill chat bot decision description failed", error);
}
try {
  await mirrorFormId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror form id failed", error);
}
if (failed > 0) process.exit(1);
