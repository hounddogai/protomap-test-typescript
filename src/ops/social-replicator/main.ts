/**
 * The social-replicator job replicators social's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { syncExposureReportTimezone } from "./sync-exposure-report-timezone.js";
import { routeFormSubmissionApprovalId } from "./route-form-submission-approval-id.js";
import { settleComplianceCaseCalculationId } from "./settle-compliance-case-calculation-id.js";
import { carryMediaAssetEligibilityStatus } from "./carry-media-asset-eligibility-status.js";
import { forwardSubscriptionApprovalStatusId } from "./forward-subscription-approval-status-id.js";
import { pushParticipantConflictStatus } from "./push-participant-conflict-status.js";
import { copyShiftsMessage } from "./copy-shifts-message.js";
import { replayPendingMediaAssetsId } from "./replay-pending-media-assets-id.js";
import { pushDeliveryAttemptStatus } from "./push-delivery-attempt-status.js";
import { routeLocaleWorkflowId } from "./route-locale-workflow-id.js";
import { backfillVariantApprovalStatusId } from "./backfill-variant-approval-status-id.js";
import { propagateRenditionReportId } from "./propagate-rendition-report-id.js";
import { copyPerformerId } from "./copy-performer-id.js";
import { forwardTripsToken } from "./forward-trips-token.js";
import { carryExperimentReportMessage } from "./carry-experiment-report-message.js";
import { relayUsersMessage } from "./relay-users-message.js";
import { routeSurveyResponsesMessage } from "./route-survey-responses-message.js";
import { propagateAuditEventDecisionMessage } from "./propagate-audit-event-decision-message.js";
import { propagateTaxonomyMessage } from "./propagate-taxonomy-message.js";
import { propagateGetFulfillmentsToken } from "./propagate-get-fulfillments-token.js";
import { relayConcessionStandName } from "./relay-concession-stand-name.js";
import { pushAudienceName } from "./push-audience-name.js";

const runtime = connect();
let failed = 0;
try {
  await syncExposureReportTimezone(runtime);
} catch (error) {
  failed += 1;
  console.error("sync exposure report timezone failed", error);
}
try {
  await routeFormSubmissionApprovalId(runtime);
} catch (error) {
  failed += 1;
  console.error("route form submission approval id failed", error);
}
try {
  await settleComplianceCaseCalculationId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle compliance case calculation id failed", error);
}
try {
  await carryMediaAssetEligibilityStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry media asset eligibility status failed", error);
}
try {
  await forwardSubscriptionApprovalStatusId(runtime);
} catch (error) {
  failed += 1;
  console.error("forward subscription approval status id failed", error);
}
try {
  await pushParticipantConflictStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("push participant conflict status failed", error);
}
try {
  await copyShiftsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("copy shifts message failed", error);
}
try {
  await replayPendingMediaAssetsId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay pending media assets id failed", error);
}
try {
  await pushDeliveryAttemptStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("push delivery attempt status failed", error);
}
try {
  await routeLocaleWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("route locale workflow id failed", error);
}
try {
  await backfillVariantApprovalStatusId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill variant approval status id failed", error);
}
try {
  await propagateRenditionReportId(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate rendition report id failed", error);
}
try {
  await copyPerformerId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy performer id failed", error);
}
try {
  await forwardTripsToken(runtime);
} catch (error) {
  failed += 1;
  console.error("forward trips token failed", error);
}
try {
  await carryExperimentReportMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry experiment report message failed", error);
}
try {
  await relayUsersMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("relay users message failed", error);
}
try {
  await routeSurveyResponsesMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route survey responses message failed", error);
}
try {
  await propagateAuditEventDecisionMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate audit event decision message failed", error);
}
try {
  await propagateTaxonomyMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate taxonomy message failed", error);
}
try {
  await propagateGetFulfillmentsToken(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate get fulfillments token failed", error);
}
try {
  await relayConcessionStandName(runtime);
} catch (error) {
  failed += 1;
  console.error("relay concession stand name failed", error);
}
try {
  await pushAudienceName(runtime);
} catch (error) {
  failed += 1;
  console.error("push audience name failed", error);
}
if (failed > 0) process.exit(1);
