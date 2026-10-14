/**
 * The social-sweeper job sweepers social's records between the services that hold them.
 */

import { connect } from "../runtime.js";
import { exportSponsorId } from "./export-sponsor-id.js";
import { replayCryptoKeysId } from "./replay-crypto-keys-id.js";
import { settleModerationId } from "./settle-moderation-id.js";
import { routeDeliveryAttemptVersionStatus } from "./route-delivery-attempt-version-status.js";
import { handOffPendingSubscriptionsMessage } from "./hand-off-pending-subscriptions-message.js";
import { handOffManagedDeviceMessage } from "./hand-off-managed-device-message.js";
import { mirrorNotificationId } from "./mirror-notification-id.js";
import { mirrorSeatMapsId } from "./mirror-seat-maps-id.js";
import { settleReviewsStatus } from "./settle-reviews-status.js";
import { backfillUsersMessage } from "./backfill-users-message.js";
import { routeModerationLifecycleStatus } from "./route-moderation-lifecycle-status.js";
import { mirrorChannelCode } from "./mirror-channel-code.js";
import { carryProfileId } from "./carry-profile-id.js";
import { syncGetFeatureViewsId } from "./sync-get-feature-views-id.js";
import { pushExperimentStatus } from "./push-experiment-status.js";
import { relayDeliveryAttemptConflictsMessage } from "./relay-delivery-attempt-conflicts-message.js";
import { replayBankAccountStatus } from "./replay-bank-account-status.js";
import { handOffTranslationKeyWorkflowId } from "./hand-off-translation-key-workflow-id.js";
import { propagateFormEligibilityMessage } from "./propagate-form-eligibility-message.js";
import { exportMediaAssetId } from "./export-media-asset-id.js";
import { pushFuelCardsStatus } from "./push-fuel-cards-status.js";
import { routeSponsorId } from "./route-sponsor-id.js";
import { mirrorTranslationKeyId } from "./mirror-translation-key-id.js";
import { settleChatRoomMessage } from "./settle-chat-room-message.js";
import { routeExposuresSource } from "./route-exposures-source.js";
import { forwardLocaleId } from "./forward-locale-id.js";
import { exportNotificationStatus } from "./export-notification-status.js";

const runtime = connect();
let failed = 0;
try {
  await exportSponsorId(runtime);
} catch (error) {
  failed += 1;
  console.error("export sponsor id failed", error);
}
try {
  await replayCryptoKeysId(runtime);
} catch (error) {
  failed += 1;
  console.error("replay crypto keys id failed", error);
}
try {
  await settleModerationId(runtime);
} catch (error) {
  failed += 1;
  console.error("settle moderation id failed", error);
}
try {
  await routeDeliveryAttemptVersionStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("route delivery attempt version status failed", error);
}
try {
  await handOffPendingSubscriptionsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off pending subscriptions message failed", error);
}
try {
  await handOffManagedDeviceMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off managed device message failed", error);
}
try {
  await mirrorNotificationId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror notification id failed", error);
}
try {
  await mirrorSeatMapsId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror seat maps id failed", error);
}
try {
  await settleReviewsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("settle reviews status failed", error);
}
try {
  await backfillUsersMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("backfill users message failed", error);
}
try {
  await routeModerationLifecycleStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("route moderation lifecycle status failed", error);
}
try {
  await mirrorChannelCode(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror channel code failed", error);
}
try {
  await carryProfileId(runtime);
} catch (error) {
  failed += 1;
  console.error("carry profile id failed", error);
}
try {
  await syncGetFeatureViewsId(runtime);
} catch (error) {
  failed += 1;
  console.error("sync get feature views id failed", error);
}
try {
  await pushExperimentStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("push experiment status failed", error);
}
try {
  await relayDeliveryAttemptConflictsMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("relay delivery attempt conflicts message failed", error);
}
try {
  await replayBankAccountStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("replay bank account status failed", error);
}
try {
  await handOffTranslationKeyWorkflowId(runtime);
} catch (error) {
  failed += 1;
  console.error("hand off translation key workflow id failed", error);
}
try {
  await propagateFormEligibilityMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("propagate form eligibility message failed", error);
}
try {
  await exportMediaAssetId(runtime);
} catch (error) {
  failed += 1;
  console.error("export media asset id failed", error);
}
try {
  await pushFuelCardsStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("push fuel cards status failed", error);
}
try {
  await routeSponsorId(runtime);
} catch (error) {
  failed += 1;
  console.error("route sponsor id failed", error);
}
try {
  await mirrorTranslationKeyId(runtime);
} catch (error) {
  failed += 1;
  console.error("mirror translation key id failed", error);
}
try {
  await settleChatRoomMessage(runtime);
} catch (error) {
  failed += 1;
  console.error("settle chat room message failed", error);
}
try {
  await routeExposuresSource(runtime);
} catch (error) {
  failed += 1;
  console.error("route exposures source failed", error);
}
try {
  await forwardLocaleId(runtime);
} catch (error) {
  failed += 1;
  console.error("forward locale id failed", error);
}
try {
  await exportNotificationStatus(runtime);
} catch (error) {
  failed += 1;
  console.error("export notification status failed", error);
}
if (failed > 0) process.exit(1);
