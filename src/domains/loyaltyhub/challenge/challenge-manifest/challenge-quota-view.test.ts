import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeQuotaView, toChallengeQuotaViews } from "./challenge-quota-view.js";
import { newChallengeQuota } from "./challenge-quota.js";

test("ChallengeQuotaView shows the status in capitals", () => {
  const item = newChallengeQuota("code-208", "title-85");
  const view = toChallengeQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeQuotaViews([item, item]).length, 2, "views");
});
