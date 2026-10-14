/**
 * The growth-mirror job mirrors growth's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { forwardCryptoKeysStatus } from "./forward-crypto-keys-status.js";
import { backfillParticipantsId } from "./backfill-participants-id.js";
import { propagateBadgeName } from "./propagate-badge-name.js";
import { backfillProductMessage } from "./backfill-product-message.js";
import { carryCollectionId } from "./carry-collection-id.js";
import { carryTranscodeJobStatus } from "./carry-transcode-job-status.js";
import { backfillWorkOrdersId } from "./backfill-work-orders-id.js";
import { syncConversationMessage } from "./sync-conversation-message.js";
import { exportStockItemsMessage } from "./export-stock-items-message.js";
import { exportJobOpeningRatesMessage } from "./export-job-opening-rates-message.js";
import { forwardChannelName } from "./forward-channel-name.js";
import { backfillCryptoKeyCalculationId } from "./backfill-crypto-key-calculation-id.js";
import { mirrorGetAppointmentsId } from "./mirror-get-appointments-id.js";
import { relayChannelConflictsStatus } from "./relay-channel-conflicts-status.js";
import { carryBadgeMessage } from "./carry-badge-message.js";
import { handOffRecommendationWorkflowId } from "./hand-off-recommendation-workflow-id.js";
import { replayPostStatus } from "./replay-post-status.js";
import { propagateDriverId } from "./propagate-driver-id.js";
import { forwardCampaignAssetsId } from "./forward-campaign-assets-id.js";
import { propagateNotificationMessage } from "./propagate-notification-message.js";
import { syncSurveyResponseId } from "./sync-survey-response-id.js";
import { forwardSubscriptionStatus } from "./forward-subscription-status.js";
import { mirrorPendingTranslationKeysId } from "./mirror-pending-translation-keys-id.js";
import { copyContentBlockWorkflowStatus } from "./copy-content-block-workflow-status.js";

const runtime = connect();
let failed = 0;
try {
  await forwardCryptoKeysStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("forward crypto keys status failed", error);
}
try {
  await backfillParticipantsId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill participants id failed", error);
}
try {
  await propagateBadgeName(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate badge name failed", error);
}
try {
  await backfillProductMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill product message failed", error);
}
try {
  await carryCollectionId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry collection id failed", error);
}
try {
  await carryTranscodeJobStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry transcode job status failed", error);
}
try {
  await backfillWorkOrdersId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill work orders id failed", error);
}
try {
  await syncConversationMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("sync conversation message failed", error);
}
try {
  await exportStockItemsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("export stock items message failed", error);
}
try {
  await exportJobOpeningRatesMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("export job opening rates message failed", error);
}
try {
  await forwardChannelName(runtime);
} catch (error) {
  failed += 1;
  console.error("forward channel name failed", error);
}
try {
  await backfillCryptoKeyCalculationId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill crypto key calculation id failed", error);
}
try {
  await mirrorGetAppointmentsId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror get appointments id failed", error);
}
try {
  await relayChannelConflictsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("relay channel conflicts status failed", error);
}
try {
  await carryBadgeMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry badge message failed", error);
}
try {
  await handOffRecommendationWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off recommendation workflow id failed", error);
}
try {
  await replayPostStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("replay post status failed", error);
}
try {
  await propagateDriverId(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate driver id failed", error);
}
try {
  await forwardCampaignAssetsId(runtime);
} catch (error) {
  failed += 1;
  console.error("forward campaign assets id failed", error);
}
try {
  await propagateNotificationMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate notification message failed", error);
}
try {
  await syncSurveyResponseId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync survey response id failed", error);
}
try {
  await forwardSubscriptionStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("forward subscription status failed", error);
}
try {
  await mirrorPendingTranslationKeysId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror pending translation keys id failed", error);
}
try {
  await copyContentBlockWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("copy content block workflow status failed", error);
}
if (failed > 0) process.exit(1);
