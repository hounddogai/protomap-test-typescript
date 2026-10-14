/**
 * The loyaltyhub-sync job syncs loyaltyhub's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { backfillWidgetLayoutsMessage } from "./backfill-widget-layouts-message.js";
import { settleTranslationJobMessage } from "./settle-translation-job-message.js";
import { mirrorAudienceId } from "./mirror-audience-id.js";
import { copyTranscodeJobsId } from "./copy-transcode-jobs-id.js";
import { copyBadgeWorkflowId } from "./copy-badge-workflow-id.js";
import { replayDemandForecastsStatus } from "./replay-demand-forecasts-status.js";
import { backfillMetricSeriesId } from "./backfill-metric-series-id.js";
import { backfillJobOpeningId } from "./backfill-job-opening-id.js";
import { relayConversationId } from "./relay-conversation-id.js";
import { pushSurveyResponseKind } from "./push-survey-response-kind.js";
import { syncTelemetryReadingsMessage } from "./sync-telemetry-readings-message.js";
import { pushContentRevisionApprovalId } from "./push-content-revision-approval-id.js";
import { carryPatientStatus } from "./carry-patient-status.js";
import { carryCustomerSegmentsId } from "./carry-customer-segments-id.js";
import { mirrorProfileCalculationId } from "./mirror-profile-calculation-id.js";
import { copySecretsId } from "./copy-secrets-id.js";
import { propagateFormFieldWorkflowName } from "./propagate-form-field-workflow-name.js";
import { routeCryptoKeyMessage } from "./route-crypto-key-message.js";
import { forwardLocaleRatesId } from "./forward-locale-rates-id.js";
import { pushHandoffsStatus } from "./push-handoffs-status.js";
import { copyHandoffReportStatus } from "./copy-handoff-report-status.js";
import { propagateWebhookSecretCode } from "./propagate-webhook-secret-code.js";
import { mirrorLocaleWorkflowId } from "./mirror-locale-workflow-id.js";
import { carryAudienceSyncKind } from "./carry-audience-sync-kind.js";
import { relayWebhookEndpointsUri } from "./relay-webhook-endpoints-uri.js";
import { backfillLoyaltyMemberRatesId } from "./backfill-loyalty-member-rates-id.js";
import { syncConfigSetId } from "./sync-config-set-id.js";
import { carryCustomersStatus } from "./carry-customers-status.js";

const runtime = connect();
let failed = 0;
try {
  await backfillWidgetLayoutsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill widget layouts message failed", error);
}
try {
  await settleTranslationJobMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("settle translation job message failed", error);
}
try {
  await mirrorAudienceId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror audience id failed", error);
}
try {
  await copyTranscodeJobsId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy transcode jobs id failed", error);
}
try {
  await copyBadgeWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy badge workflow id failed", error);
}
try {
  await replayDemandForecastsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("replay demand forecasts status failed", error);
}
try {
  await backfillMetricSeriesId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill metric series id failed", error);
}
try {
  await backfillJobOpeningId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill job opening id failed", error);
}
try {
  await relayConversationId(runtime);
} catch (error) {
  failed += 1;
  console.error("relay conversation id failed", error);
}
try {
  await pushSurveyResponseKind(runtime);
} catch (error) {
  failed += 1;
  console.error("push survey response kind failed", error);
}
try {
  await syncTelemetryReadingsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("sync telemetry readings message failed", error);
}
try {
  await pushContentRevisionApprovalId(runtime);
} catch (error) {
  failed += 1;
  console.error("push content revision approval id failed", error);
}
try {
  await carryPatientStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry patient status failed", error);
}
try {
  await carryCustomerSegmentsId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry customer segments id failed", error);
}
try {
  await mirrorProfileCalculationId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror profile calculation id failed", error);
}
try {
  await copySecretsId(runtime);
} catch (error) {
  failed += 1;
  console.error("copy secrets id failed", error);
}
try {
  await propagateFormFieldWorkflowName(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate form field workflow name failed", error);
}
try {
  await routeCryptoKeyMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route crypto key message failed", error);
}
try {
  await forwardLocaleRatesId(runtime);
} catch (error) {
  failed += 1;
  console.error("forward locale rates id failed", error);
}
try {
  await pushHandoffsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("push handoffs status failed", error);
}
try {
  await copyHandoffReportStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("copy handoff report status failed", error);
}
try {
  await propagateWebhookSecretCode(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate webhook secret code failed", error);
}
try {
  await mirrorLocaleWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror locale workflow id failed", error);
}
try {
  await carryAudienceSyncKind(runtime);
} catch (error) {
  failed += 1;
  console.error("carry audience sync kind failed", error);
}
try {
  await relayWebhookEndpointsUri(runtime);
} catch (error) {
  failed += 1;
  console.error("relay webhook endpoints uri failed", error);
}
try {
  await backfillLoyaltyMemberRatesId(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill loyalty member rates id failed", error);
}
try {
  await syncConfigSetId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync config set id failed", error);
}
try {
  await carryCustomersStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry customers status failed", error);
}
if (failed > 0) process.exit(1);
