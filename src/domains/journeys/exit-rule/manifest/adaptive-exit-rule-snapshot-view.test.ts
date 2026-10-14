import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveExitRuleSnapshotView,
  toAdaptiveExitRuleSnapshotViews,
} from "./adaptive-exit-rule-snapshot-view.js";
import { newAdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

test("AdaptiveExitRuleSnapshotView shows the status in capitals", () => {
  const item = newAdaptiveExitRuleSnapshot("code-417", "label-588");
  const view = toAdaptiveExitRuleSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveExitRuleSnapshotViews([item, item]).length, 2, "views");
});
