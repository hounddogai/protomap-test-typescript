/**
 * The deliverability-sweeper job sweepers deliverability's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { copyWidgetLayoutSourceMessage } from "./copy-widget-layout-source-message.js";
import { handOffFeatureFlagsId } from "./hand-off-feature-flags-id.js";
import { forwardFormSubmissionMessage } from "./forward-form-submission-message.js";
import { mirrorOnboardingPlansId } from "./mirror-onboarding-plans-id.js";
import { propagateChannelTotalsId } from "./propagate-channel-totals-id.js";
import { carryFormWorkflowStatus } from "./carry-form-workflow-status.js";
import { relaySecretMessage } from "./relay-secret-message.js";
import { syncNotificationsTimezone } from "./sync-notifications-timezone.js";
import { carryBudgetId } from "./carry-budget-id.js";
import { routeExposureDecisionMessage } from "./route-exposure-decision-message.js";
import { settleFormSubmissionWorkflowId } from "./settle-form-submission-workflow-id.js";
import { settleFuelCardsId } from "./settle-fuel-cards-id.js";
import { syncCampaignAssetCode } from "./sync-campaign-asset-code.js";
import { carryPipelinesId } from "./carry-pipelines-id.js";
import { exportGiftCardStatus } from "./export-gift-card-status.js";
import { syncMarketingCampaignsId } from "./sync-marketing-campaigns-id.js";
import { syncTranscodeJobId } from "./sync-transcode-job-id.js";
import { routePendingSurveysMessage } from "./route-pending-surveys-message.js";
import { forwardTranslationKeyName } from "./forward-translation-key-name.js";

const runtime = connect();
let failed = 0;
try {
  await copyWidgetLayoutSourceMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("copy widget layout source message failed", error);
}
try {
  await handOffFeatureFlagsId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off feature flags id failed", error);
}
try {
  await forwardFormSubmissionMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("forward form submission message failed", error);
}
try {
  await mirrorOnboardingPlansId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror onboarding plans id failed", error);
}
try {
  await propagateChannelTotalsId(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate channel totals id failed", error);
}
try {
  await carryFormWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry form workflow status failed", error);
}
try {
  await relaySecretMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("relay secret message failed", error);
}
try {
  await syncNotificationsTimezone(runtime);
} catch (error) {
  failed += 1;
  console.error("sync notifications timezone failed", error);
}
try {
  await carryBudgetId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry budget id failed", error);
}
try {
  await routeExposureDecisionMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route exposure decision message failed", error);
}
try {
  await settleFormSubmissionWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle form submission workflow id failed", error);
}
try {
  await settleFuelCardsId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle fuel cards id failed", error);
}
try {
  await syncCampaignAssetCode(runtime);
} catch (error) {
  failed += 1;
  console.error("sync campaign asset code failed", error);
}
try {
  await carryPipelinesId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry pipelines id failed", error);
}
try {
  await exportGiftCardStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("export gift card status failed", error);
}
try {
  await syncMarketingCampaignsId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync marketing campaigns id failed", error);
}
try {
  await syncTranscodeJobId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync transcode job id failed", error);
}
try {
  await routePendingSurveysMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route pending surveys message failed", error);
}
try {
  await forwardTranslationKeyName(runtime);
} catch (error) {
  failed += 1;
  console.error("forward translation key name failed", error);
}
if (failed > 0) process.exit(1);
