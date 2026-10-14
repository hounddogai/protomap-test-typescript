/**
 * The consentcenter-relay job relays consentcenter's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { propagateAudienceSyncWorkflowStatus } from "./propagate-audience-sync-workflow-status.js";
import { exportConversationWorkflowId } from "./export-conversation-workflow-id.js";
import { settleLocalesToken } from "./settle-locales-token.js";
import { carryFixedAssetId } from "./carry-fixed-asset-id.js";
import { propagateCarePlanMessage } from "./propagate-care-plan-message.js";
import { syncSearchIndexesToken } from "./sync-search-indexes-token.js";
import { handOffContentBlockId } from "./hand-off-content-block-id.js";
import { handOffMediaAssetCode } from "./hand-off-media-asset-code.js";
import { copyExposureImportColumnsId } from "./copy-exposure-import-columns-id.js";
import { forwardWebhookSecretId } from "./forward-webhook-secret-id.js";
import { replayNotificationSubject } from "./replay-notification-subject.js";
import { forwardMediaAssetWorkflowCode } from "./forward-media-asset-workflow-code.js";
import { propagateSurveyWorkflowNotes } from "./propagate-survey-workflow-notes.js";
import { copyCartId } from "./copy-cart-id.js";
import { routeChatMessageConflictsMessage } from "./route-chat-message-conflicts-message.js";
import { backfillForumWorkflowStatus } from "./backfill-forum-workflow-status.js";
import { backfillIncidentId } from "./backfill-incident-id.js";
import { exportAffinityMessage } from "./export-affinity-message.js";
import { replayPolicyCalculationId } from "./replay-policy-calculation-id.js";
import { copyRegisteredModelCode } from "./copy-registered-model-code.js";
import { relayLabelingTasksToken } from "./relay-labeling-tasks-token.js";
import { carryUserMessage } from "./carry-user-message.js";
import { handOffFormOptionsStatus } from "./hand-off-form-options-status.js";
import { syncCarePlanId } from "./sync-care-plan-id.js";
import { routeTelemetryReadingsToken } from "./route-telemetry-readings-token.js";
import { carryBuildingRatesMessage } from "./carry-building-rates-message.js";
import { relayGiftCardStatus } from "./relay-gift-card-status.js";
import { exportChannelCode } from "./export-channel-code.js";

const runtime = connect();
let failed = 0;
try {
  await propagateAudienceSyncWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate audience sync workflow status failed", error);
}
try {
  await exportConversationWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("export conversation workflow id failed", error);
}
try {
  await settleLocalesToken(runtime);
} catch (error) {
  failed += 1;
  console.error("settle locales token failed", error);
}
try {
  await carryFixedAssetId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry fixed asset id failed", error);
}
try {
  await propagateCarePlanMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate care plan message failed", error);
}
try {
  await syncSearchIndexesToken(runtime);
} catch (error) {
  failed += 1;
  console.error("sync search indexes token failed", error);
}
try {
  await handOffContentBlockId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off content block id failed", error);
}
try {
  await handOffMediaAssetCode(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off media asset code failed", error);
}
try {
  await copyExposureImportColumnsId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy exposure import columns id failed", error);
}
try {
  await forwardWebhookSecretId(runtime);
} catch (error) {
  failed += 1;
  console.error("forward webhook secret id failed", error);
}
try {
  await replayNotificationSubject(runtime);
} catch (error) {
  failed += 1;
  console.error("replay notification subject failed", error);
}
try {
  await forwardMediaAssetWorkflowCode(runtime);
} catch (error) {
  failed += 1;
  console.error("forward media asset workflow code failed", error);
}
try {
  await propagateSurveyWorkflowNotes(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate survey workflow notes failed", error);
}
try {
  await copyCartId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy cart id failed", error);
}
try {
  await routeChatMessageConflictsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route chat message conflicts message failed", error);
}
try {
  await backfillForumWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill forum workflow status failed", error);
}
try {
  await backfillIncidentId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill incident id failed", error);
}
try {
  await exportAffinityMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("export affinity message failed", error);
}
try {
  await replayPolicyCalculationId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay policy calculation id failed", error);
}
try {
  await copyRegisteredModelCode(runtime);
} catch (error) {
  failed += 1;
  console.error("copy registered model code failed", error);
}
try {
  await relayLabelingTasksToken(runtime);
} catch (error) {
  failed += 1;
  console.error("relay labeling tasks token failed", error);
}
try {
  await carryUserMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry user message failed", error);
}
try {
  await handOffFormOptionsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off form options status failed", error);
}
try {
  await syncCarePlanId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync care plan id failed", error);
}
try {
  await routeTelemetryReadingsToken(runtime);
} catch (error) {
  failed += 1;
  console.error("route telemetry readings token failed", error);
}
try {
  await carryBuildingRatesMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry building rates message failed", error);
}
try {
  await relayGiftCardStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("relay gift card status failed", error);
}
try {
  await exportChannelCode(runtime);
} catch (error) {
  failed += 1;
  console.error("export channel code failed", error);
}
if (failed > 0) process.exit(1);
