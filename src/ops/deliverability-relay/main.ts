/**
 * The deliverability-relay job relays deliverability's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { forwardShowsTimezone } from "./forward-shows-timezone.js";
import { exportShiftsMessage } from "./export-shifts-message.js";
import { pushFormFieldRatesName } from "./push-form-field-rates-name.js";
import { syncPostRulesId } from "./sync-post-rules-id.js";
import { copyTranslationJobsId } from "./copy-translation-jobs-id.js";
import { propagateDeliveryAttemptRulesKind } from "./propagate-delivery-attempt-rules-kind.js";
import { exportBroadcastId } from "./export-broadcast-id.js";
import { syncMarketingCampaignTitle } from "./sync-marketing-campaign-title.js";
import { copyConcessionStandStatus } from "./copy-concession-stand-status.js";
import { syncBadgeId } from "./sync-badge-id.js";
import { exportRegisteredModelsStatus } from "./export-registered-models-status.js";
import { exportQuestionWorkflowId } from "./export-question-workflow-id.js";
import { relayFormNotes } from "./relay-form-notes.js";
import { exportFormSubmissionStatus } from "./export-form-submission-status.js";
import { relayFeatureViewId } from "./relay-feature-view-id.js";
import { carryWidgetLayoutEventMessage } from "./carry-widget-layout-event-message.js";
import { handOffExposureImportId } from "./hand-off-exposure-import-id.js";
import { copyRecommendationId } from "./copy-recommendation-id.js";
import { exportConversationApprovalId } from "./export-conversation-approval-id.js";

const runtime = connect();
let failed = 0;
try {
  await forwardShowsTimezone(runtime);
} catch (error) {
  failed += 1;
  console.error("forward shows timezone failed", error);
}
try {
  await exportShiftsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("export shifts message failed", error);
}
try {
  await pushFormFieldRatesName(runtime);
} catch (error) {
  failed += 1;
  console.error("push form field rates name failed", error);
}
try {
  await syncPostRulesId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync post rules id failed", error);
}
try {
  await copyTranslationJobsId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy translation jobs id failed", error);
}
try {
  await propagateDeliveryAttemptRulesKind(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate delivery attempt rules kind failed", error);
}
try {
  await exportBroadcastId(runtime);
} catch (error) {
  failed += 1;
  console.error("export broadcast id failed", error);
}
try {
  await syncMarketingCampaignTitle(runtime);
} catch (error) {
  failed += 1;
  console.error("sync marketing campaign title failed", error);
}
try {
  await copyConcessionStandStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("copy concession stand status failed", error);
}
try {
  await syncBadgeId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync badge id failed", error);
}
try {
  await exportRegisteredModelsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("export registered models status failed", error);
}
try {
  await exportQuestionWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("export question workflow id failed", error);
}
try {
  await relayFormNotes(runtime);
} catch (error) {
  failed += 1;
  console.error("relay form notes failed", error);
}
try {
  await exportFormSubmissionStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("export form submission status failed", error);
}
try {
  await relayFeatureViewId(runtime);
} catch (error) {
  failed += 1;
  console.error("relay feature view id failed", error);
}
try {
  await carryWidgetLayoutEventMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry widget layout event message failed", error);
}
try {
  await handOffExposureImportId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off exposure import id failed", error);
}
try {
  await copyRecommendationId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy recommendation id failed", error);
}
try {
  await exportConversationApprovalId(runtime);
} catch (error) {
  failed += 1;
  console.error("export conversation approval id failed", error);
}
if (failed > 0) process.exit(1);
