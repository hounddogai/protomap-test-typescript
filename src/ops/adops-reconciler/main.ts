/**
 * The adops-reconciler job reconcilers adops's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { backfillAudienceId } from "./backfill-audience-id.js";
import { relayRecommendationId } from "./relay-recommendation-id.js";
import { backfillChatBotsId } from "./backfill-chat-bots-id.js";
import { settleTranscodeJobConflictMessage } from "./settle-transcode-job-conflict-message.js";
import { mirrorWebhookSecretCalculationMessage } from "./mirror-webhook-secret-calculation-message.js";
import { propagateConversationExpiryStatus } from "./propagate-conversation-expiry-status.js";
import { mirrorCustomerId } from "./mirror-customer-id.js";
import { replayPatientsId } from "./replay-patients-id.js";
import { settleExperimentReportId } from "./settle-experiment-report-id.js";
import { carryRiskRegisterMessage } from "./carry-risk-register-message.js";
import { pushMetricSeriesesStatus } from "./push-metric-serieses-status.js";
import { propagateTranslationJobDecisionMessage } from "./propagate-translation-job-decision-message.js";
import { propagateTranslationKeyDecisionId } from "./propagate-translation-key-decision-id.js";
import { forwardHandoffWorkflowStatus } from "./forward-handoff-workflow-status.js";
import { carrySearchIndexMessage } from "./carry-search-index-message.js";
import { carryRenditionWorkflowMessage } from "./carry-rendition-workflow-message.js";
import { relayAudienceSyncMessage } from "./relay-audience-sync-message.js";
import { replayDriverStatus } from "./replay-driver-status.js";
import { forwardVideoVisitMessage } from "./forward-video-visit-message.js";
import { carryFeatureViewOptionsId } from "./carry-feature-view-options-id.js";
import { carryRenditionMessage } from "./carry-rendition-message.js";
import { propagateCampaignBudgetId } from "./propagate-campaign-budget-id.js";
import { copyMediaAssetReportName } from "./copy-media-asset-report-name.js";
import { mirrorExposureStatus } from "./mirror-exposure-status.js";
import { routeParticipantImportId } from "./route-participant-import-id.js";
import { carryChartOfAccountsesToken } from "./carry-chart-of-accountses-token.js";
import { exportMetricSeriesesTimezone } from "./export-metric-serieses-timezone.js";

const runtime = connect();
let failed = 0;
try {
  await backfillAudienceId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill audience id failed", error);
}
try {
  await relayRecommendationId(runtime);
} catch (error) {
  failed += 1;
  console.error("relay recommendation id failed", error);
}
try {
  await backfillChatBotsId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill chat bots id failed", error);
}
try {
  await settleTranscodeJobConflictMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("settle transcode job conflict message failed", error);
}
try {
  await mirrorWebhookSecretCalculationMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror webhook secret calculation message failed", error);
}
try {
  await propagateConversationExpiryStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate conversation expiry status failed", error);
}
try {
  await mirrorCustomerId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror customer id failed", error);
}
try {
  await replayPatientsId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay patients id failed", error);
}
try {
  await settleExperimentReportId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle experiment report id failed", error);
}
try {
  await carryRiskRegisterMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry risk register message failed", error);
}
try {
  await pushMetricSeriesesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("push metric serieses status failed", error);
}
try {
  await propagateTranslationJobDecisionMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate translation job decision message failed", error);
}
try {
  await propagateTranslationKeyDecisionId(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate translation key decision id failed", error);
}
try {
  await forwardHandoffWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("forward handoff workflow status failed", error);
}
try {
  await carrySearchIndexMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry search index message failed", error);
}
try {
  await carryRenditionWorkflowMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry rendition workflow message failed", error);
}
try {
  await relayAudienceSyncMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("relay audience sync message failed", error);
}
try {
  await replayDriverStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("replay driver status failed", error);
}
try {
  await forwardVideoVisitMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("forward video visit message failed", error);
}
try {
  await carryFeatureViewOptionsId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry feature view options id failed", error);
}
try {
  await carryRenditionMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry rendition message failed", error);
}
try {
  await propagateCampaignBudgetId(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate campaign budget id failed", error);
}
try {
  await copyMediaAssetReportName(runtime);
} catch (error) {
  failed += 1;
  console.error("copy media asset report name failed", error);
}
try {
  await mirrorExposureStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror exposure status failed", error);
}
try {
  await routeParticipantImportId(runtime);
} catch (error) {
  failed += 1;
  console.error("route participant import id failed", error);
}
try {
  await carryChartOfAccountsesToken(runtime);
} catch (error) {
  failed += 1;
  console.error("carry chart of accountses token failed", error);
}
try {
  await exportMetricSeriesesTimezone(runtime);
} catch (error) {
  failed += 1;
  console.error("export metric serieses timezone failed", error);
}
if (failed > 0) process.exit(1);
