/**
 * The adops-backfill job backfills adops's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { propagateRenditionApprovalStatusMessage } from "./propagate-rendition-approval-status-message.js";
import { syncDeliveryAttemptSyncStateKind } from "./sync-delivery-attempt-sync-state-kind.js";
import { mirrorTaxonomyStatus } from "./mirror-taxonomy-status.js";
import { settleFuelCardsMessage } from "./settle-fuel-cards-message.js";
import { relayWebhookEndpointId } from "./relay-webhook-endpoint-id.js";
import { mirrorGetArticlesId } from "./mirror-get-articles-id.js";
import { replaySearchIndexId } from "./replay-search-index-id.js";
import { replayLineageNodesCode } from "./replay-lineage-nodes-code.js";
import { settleMediaAssetStatus } from "./settle-media-asset-status.js";
import { carrySurveysToken } from "./carry-surveys-token.js";
import { relayTranslationJobReportStatus } from "./relay-translation-job-report-status.js";
import { forwardDocumentId } from "./forward-document-id.js";
import { settleMetricSeriesId } from "./settle-metric-series-id.js";
import { relayLabelingTasksUri } from "./relay-labeling-tasks-uri.js";
import { routePurchaseRequisitionsId } from "./route-purchase-requisitions-id.js";
import { syncClientSessionsMessage } from "./sync-client-sessions-message.js";
import { handOffProductsCode } from "./hand-off-products-code.js";
import { pushBoxOfficeSaleCalculationMessage } from "./push-box-office-sale-calculation-message.js";
import { propagateConfigSetCalculationStatus } from "./propagate-config-set-calculation-status.js";
import { replayExperimentEligibilityStatus } from "./replay-experiment-eligibility-status.js";
import { syncPrescriptionNotes } from "./sync-prescription-notes.js";
import { forwardTranslationJobLifecycleSubject } from "./forward-translation-job-lifecycle-subject.js";
import { settleFormSubmissionRatesMessage } from "./settle-form-submission-rates-message.js";
import { propagateRenditionStatus } from "./propagate-rendition-status.js";
import { forwardModerationRulesId } from "./forward-moderation-rules-id.js";
import { handOffPrescriptionMessage } from "./hand-off-prescription-message.js";
import { settleUserDecisionStatus } from "./settle-user-decision-status.js";
import { syncSeatMapId } from "./sync-seat-map-id.js";
import { copyPriceListId } from "./copy-price-list-id.js";
import { pushQuestionRulesStatus } from "./push-question-rules-status.js";

const runtime = connect();
let failed = 0;
try {
  await propagateRenditionApprovalStatusMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate rendition approval status message failed", error);
}
try {
  await syncDeliveryAttemptSyncStateKind(runtime);
} catch (error) {
  failed += 1;
  console.error("sync delivery attempt sync state kind failed", error);
}
try {
  await mirrorTaxonomyStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror taxonomy status failed", error);
}
try {
  await settleFuelCardsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("settle fuel cards message failed", error);
}
try {
  await relayWebhookEndpointId(runtime);
} catch (error) {
  failed += 1;
  console.error("relay webhook endpoint id failed", error);
}
try {
  await mirrorGetArticlesId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror get articles id failed", error);
}
try {
  await replaySearchIndexId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay search index id failed", error);
}
try {
  await replayLineageNodesCode(runtime);
} catch (error) {
  failed += 1;
  console.error("replay lineage nodes code failed", error);
}
try {
  await settleMediaAssetStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("settle media asset status failed", error);
}
try {
  await carrySurveysToken(runtime);
} catch (error) {
  failed += 1;
  console.error("carry surveys token failed", error);
}
try {
  await relayTranslationJobReportStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("relay translation job report status failed", error);
}
try {
  await forwardDocumentId(runtime);
} catch (error) {
  failed += 1;
  console.error("forward document id failed", error);
}
try {
  await settleMetricSeriesId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle metric series id failed", error);
}
try {
  await relayLabelingTasksUri(runtime);
} catch (error) {
  failed += 1;
  console.error("relay labeling tasks uri failed", error);
}
try {
  await routePurchaseRequisitionsId(runtime);
} catch (error) {
  failed += 1;
  console.error("route purchase requisitions id failed", error);
}
try {
  await syncClientSessionsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("sync client sessions message failed", error);
}
try {
  await handOffProductsCode(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off products code failed", error);
}
try {
  await pushBoxOfficeSaleCalculationMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("push box office sale calculation message failed", error);
}
try {
  await propagateConfigSetCalculationStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate config set calculation status failed", error);
}
try {
  await replayExperimentEligibilityStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("replay experiment eligibility status failed", error);
}
try {
  await syncPrescriptionNotes(runtime);
} catch (error) {
  failed += 1;
  console.error("sync prescription notes failed", error);
}
try {
  await forwardTranslationJobLifecycleSubject(runtime);
} catch (error) {
  failed += 1;
  console.error("forward translation job lifecycle subject failed", error);
}
try {
  await settleFormSubmissionRatesMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("settle form submission rates message failed", error);
}
try {
  await propagateRenditionStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate rendition status failed", error);
}
try {
  await forwardModerationRulesId(runtime);
} catch (error) {
  failed += 1;
  console.error("forward moderation rules id failed", error);
}
try {
  await handOffPrescriptionMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off prescription message failed", error);
}
try {
  await settleUserDecisionStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("settle user decision status failed", error);
}
try {
  await syncSeatMapId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync seat map id failed", error);
}
try {
  await copyPriceListId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy price list id failed", error);
}
try {
  await pushQuestionRulesStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("push question rules status failed", error);
}
if (failed > 0) process.exit(1);
