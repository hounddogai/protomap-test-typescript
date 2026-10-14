import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleSnapshotView, toRewardRuleSnapshotViews } from "./reward-rule-snapshot-view.js";
import { newRewardRuleSnapshot } from "./reward-rule-snapshot.js";

test("RewardRuleSnapshotView shows the status in capitals", () => {
  const item = newRewardRuleSnapshot("code-63", "label-291");
  const view = toRewardRuleSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleSnapshotViews([item, item]).length, 2, "views");
});
