/**
 * The loyaltyhub-backfill job backfills loyaltyhub's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { carryDispatchOrdersStatus } from "./carry-dispatch-orders-status.js";
import { handOffLocaleId } from "./hand-off-locale-id.js";
import { mirrorNotificationTemplateWatchersNumber } from "./mirror-notification-template-watchers-number.js";
import { carryRiskRegisterId } from "./carry-risk-register-id.js";
import { pushMediaAssetDecisionId } from "./push-media-asset-decision-id.js";
import { settleLineageNodeId } from "./settle-lineage-node-id.js";
import { backfillForumWorkflowStatus } from "./backfill-forum-workflow-status.js";
import { mirrorChannelId } from "./mirror-channel-id.js";
import { pushShowOptionsCode } from "./push-show-options-code.js";
import { settleRouteBindingsStatus } from "./settle-route-bindings-status.js";
import { backfillSoftwareLicenseCode } from "./backfill-software-license-code.js";
import { syncAudienceMemberWorkflowsStatus } from "./sync-audience-member-workflows-status.js";
import { replayForumMessage } from "./replay-forum-message.js";
import { copyCollectionCasesToken } from "./copy-collection-cases-token.js";
import { handOffNotificationTemplateCode } from "./hand-off-notification-template-code.js";
import { handOffNotificationsId } from "./hand-off-notifications-id.js";
import { mirrorDeliveryAttemptKind } from "./mirror-delivery-attempt-kind.js";
import { propagateStockItemMessage } from "./propagate-stock-item-message.js";
import { pushAccessPolicyId } from "./push-access-policy-id.js";
import { exportSuppliersStatus } from "./export-suppliers-status.js";

const runtime = connect();
let failed = 0;
try {
  await carryDispatchOrdersStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("carry dispatch orders status failed", error);
}
try {
  await handOffLocaleId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off locale id failed", error);
}
try {
  await mirrorNotificationTemplateWatchersNumber(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror notification template watchers number failed", error);
}
try {
  await carryRiskRegisterId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry risk register id failed", error);
}
try {
  await pushMediaAssetDecisionId(runtime);
} catch (error) {
  failed += 1;
  console.error("push media asset decision id failed", error);
}
try {
  await settleLineageNodeId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle lineage node id failed", error);
}
try {
  await backfillForumWorkflowStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill forum workflow status failed", error);
}
try {
  await mirrorChannelId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror channel id failed", error);
}
try {
  await pushShowOptionsCode(runtime);
} catch (error) {
  failed += 1;
  console.error("push show options code failed", error);
}
try {
  await settleRouteBindingsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("settle route bindings status failed", error);
}
try {
  await backfillSoftwareLicenseCode(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill software license code failed", error);
}
try {
  await syncAudienceMemberWorkflowsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("sync audience member workflows status failed", error);
}
try {
  await replayForumMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("replay forum message failed", error);
}
try {
  await copyCollectionCasesToken(runtime);
} catch (error) {
  failed += 1;
  console.error("copy collection cases token failed", error);
}
try {
  await handOffNotificationTemplateCode(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off notification template code failed", error);
}
try {
  await handOffNotificationsId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off notifications id failed", error);
}
try {
  await mirrorDeliveryAttemptKind(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror delivery attempt kind failed", error);
}
try {
  await propagateStockItemMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate stock item message failed", error);
}
try {
  await pushAccessPolicyId(runtime);
} catch (error) {
  failed += 1;
  console.error("push access policy id failed", error);
}
try {
  await exportSuppliersStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("export suppliers status failed", error);
}
if (failed > 0) process.exit(1);
