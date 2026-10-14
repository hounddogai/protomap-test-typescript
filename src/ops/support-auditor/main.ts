/**
 * The support-auditor job auditors support's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { handOffChatMessageId } from "./hand-off-chat-message-id.js";
import { replayGetDatasetsStatus } from "./replay-get-datasets-status.js";
import { handOffTranscodeJobWorkflowId } from "./hand-off-transcode-job-workflow-id.js";
import { backfillDriversToken } from "./backfill-drivers-token.js";
import { settleAffinityWorkflowMessage } from "./settle-affinity-workflow-message.js";
import { routeAffinityKind } from "./route-affinity-kind.js";
import { exportProductStatus } from "./export-product-status.js";
import { carryChatRoomId } from "./carry-chat-room-id.js";
import { pushBoxOfficeSalesId } from "./push-box-office-sales-id.js";
import { syncTranscodeJobReportsMessage } from "./sync-transcode-job-reports-message.js";
import { copyBudgetsMessage } from "./copy-budgets-message.js";
import { carryCryptoKeysStatus } from "./carry-crypto-keys-status.js";
import { forwardProductMessage } from "./forward-product-message.js";
import { routeMediaAssetMessage } from "./route-media-asset-message.js";
import { mirrorSessionSubject } from "./mirror-session-subject.js";
import { routeProfilesId } from "./route-profiles-id.js";
import { copyDocumentEligibilityNumber } from "./copy-document-eligibility-number.js";
import { routeForumName } from "./route-forum-name.js";
import { propagatePrescriptionsStatus } from "./propagate-prescriptions-status.js";
import { replayRegisteredModelStatus } from "./replay-registered-model-status.js";
import { copyRecommendationSetsMessage } from "./copy-recommendation-sets-message.js";
import { carryGetCarePlansMessage } from "./carry-get-care-plans-message.js";

const runtime = connect();
let failed = 0;
try {
  await handOffChatMessageId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off chat message id failed", error);
}
try {
  await replayGetDatasetsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("replay get datasets status failed", error);
}
try {
  await handOffTranscodeJobWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off transcode job workflow id failed", error);
}
try {
  await backfillDriversToken(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill drivers token failed", error);
}
try {
  await settleAffinityWorkflowMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("settle affinity workflow message failed", error);
}
try {
  await routeAffinityKind(runtime);
} catch (error) {
  failed += 1;
  console.error("route affinity kind failed", error);
}
try {
  await exportProductStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("export product status failed", error);
}
try {
  await carryChatRoomId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry chat room id failed", error);
}
try {
  await pushBoxOfficeSalesId(runtime);
} catch (error) {
  failed += 1;
  console.error("push box office sales id failed", error);
}
try {
  await syncTranscodeJobReportsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("sync transcode job reports message failed", error);
}
try {
  await copyBudgetsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("copy budgets message failed", error);
}
try {
  await carryCryptoKeysStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry crypto keys status failed", error);
}
try {
  await forwardProductMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("forward product message failed", error);
}
try {
  await routeMediaAssetMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("route media asset message failed", error);
}
try {
  await mirrorSessionSubject(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror session subject failed", error);
}
try {
  await routeProfilesId(runtime);
} catch (error) {
  failed += 1;
  console.error("route profiles id failed", error);
}
try {
  await copyDocumentEligibilityNumber(runtime);
} catch (error) {
  failed += 1;
  console.error("copy document eligibility number failed", error);
}
try {
  await routeForumName(runtime);
} catch (error) {
  failed += 1;
  console.error("route forum name failed", error);
}
try {
  await propagatePrescriptionsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate prescriptions status failed", error);
}
try {
  await replayRegisteredModelStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("replay registered model status failed", error);
}
try {
  await copyRecommendationSetsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("copy recommendation sets message failed", error);
}
try {
  await carryGetCarePlansMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("carry get care plans message failed", error);
}
if (failed > 0) process.exit(1);
