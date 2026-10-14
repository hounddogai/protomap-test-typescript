/**
 * The consentcenter-reconciler job reconcilers consentcenter's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { carryHandoffExpiryStatus } from "./carry-handoff-expiry-status.js";
import { exportPreferenceDecisionId } from "./export-preference-decision-id.js";
import { copyTranscodeJobId } from "./copy-transcode-job-id.js";
import { backfillSponsorMessage } from "./backfill-sponsor-message.js";
import { pushQuestionMessage } from "./push-question-message.js";
import { pushDeliveryAttemptWorkflowId } from "./push-delivery-attempt-workflow-id.js";
import { propagateProfilesStatus } from "./propagate-profiles-status.js";
import { settlePipelineTitle } from "./settle-pipeline-title.js";
import { propagateAudienceDecisionMessage } from "./propagate-audience-decision-message.js";
import { pushAudienceMemberWorkflowStatus } from "./push-audience-member-workflow-status.js";
import { exportMediaAssetRatesMessage } from "./export-media-asset-rates-message.js";
import { forwardMediaAssetWorkflowName } from "./forward-media-asset-workflow-name.js";
import { replayTaxonomyId } from "./replay-taxonomy-id.js";
import { syncDeliveriesId } from "./sync-deliveries-id.js";
import { copyHandoffWorkflowStatus } from "./copy-handoff-workflow-status.js";
import { replayChatMessageReportsId } from "./replay-chat-message-reports-id.js";
import { handOffParticipantId } from "./hand-off-participant-id.js";
import { exportArticleWorkflowId } from "./export-article-workflow-id.js";
import { relayAdmissionsMessage } from "./relay-admissions-message.js";
import { syncTaxonomyId } from "./sync-taxonomy-id.js";
import { relayCollectionCasesStatus } from "./relay-collection-cases-status.js";
import { forwardMetricSeriesesMessage } from "./forward-metric-serieses-message.js";
import { settleVariantWorkflowDescription } from "./settle-variant-workflow-description.js";
import { forwardForumMessage } from "./forward-forum-message.js";
import { copyClientSessionEventSubject } from "./copy-client-session-event-subject.js";
import { forwardCampaignAssetName } from "./forward-campaign-asset-name.js";
import { exportWidgetLayoutTestNoticeStatus } from "./export-widget-layout-test-notice-status.js";
import { syncConsentRecordOptionsId } from "./sync-consent-record-options-id.js";
import { syncMediaAssetId } from "./sync-media-asset-id.js";
import { handOffPurchaseRequisitionsStatus } from "./hand-off-purchase-requisitions-status.js";

const runtime = connect();
let failed = 0;
try {
  await carryHandoffExpiryStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry handoff expiry status failed", error);
}
try {
  await exportPreferenceDecisionId(runtime);
} catch (error) {
  failed += 1;
  console.error("export preference decision id failed", error);
}
try {
  await copyTranscodeJobId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy transcode job id failed", error);
}
try {
  await backfillSponsorMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill sponsor message failed", error);
}
try {
  await pushQuestionMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("push question message failed", error);
}
try {
  await pushDeliveryAttemptWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("push delivery attempt workflow id failed", error);
}
try {
  await propagateProfilesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate profiles status failed", error);
}
try {
  await settlePipelineTitle(runtime);
} catch (error) {
  failed += 1;
  console.error("settle pipeline title failed", error);
}
try {
  await propagateAudienceDecisionMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate audience decision message failed", error);
}
try {
  await pushAudienceMemberWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("push audience member workflow status failed", error);
}
try {
  await exportMediaAssetRatesMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("export media asset rates message failed", error);
}
try {
  await forwardMediaAssetWorkflowName(runtime);
} catch (error) {
  failed += 1;
  console.error("forward media asset workflow name failed", error);
}
try {
  await replayTaxonomyId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay taxonomy id failed", error);
}
try {
  await syncDeliveriesId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync deliveries id failed", error);
}
try {
  await copyHandoffWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("copy handoff workflow status failed", error);
}
try {
  await replayChatMessageReportsId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay chat message reports id failed", error);
}
try {
  await handOffParticipantId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off participant id failed", error);
}
try {
  await exportArticleWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("export article workflow id failed", error);
}
try {
  await relayAdmissionsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("relay admissions message failed", error);
}
try {
  await syncTaxonomyId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync taxonomy id failed", error);
}
try {
  await relayCollectionCasesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("relay collection cases status failed", error);
}
try {
  await forwardMetricSeriesesMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("forward metric serieses message failed", error);
}
try {
  await settleVariantWorkflowDescription(runtime);
} catch (error) {
  failed += 1;
  console.error("settle variant workflow description failed", error);
}
try {
  await forwardForumMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("forward forum message failed", error);
}
try {
  await copyClientSessionEventSubject(runtime);
} catch (error) {
  failed += 1;
  console.error("copy client session event subject failed", error);
}
try {
  await forwardCampaignAssetName(runtime);
} catch (error) {
  failed += 1;
  console.error("forward campaign asset name failed", error);
}
try {
  await exportWidgetLayoutTestNoticeStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("export widget layout test notice status failed", error);
}
try {
  await syncConsentRecordOptionsId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync consent record options id failed", error);
}
try {
  await syncMediaAssetId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync media asset id failed", error);
}
try {
  await handOffPurchaseRequisitionsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off purchase requisitions status failed", error);
}
if (failed > 0) process.exit(1);
