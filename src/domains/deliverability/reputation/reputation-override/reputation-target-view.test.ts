import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationTargetView, toReputationTargetViews } from "./reputation-target-view.js";
import { newReputationTarget } from "./reputation-target.js";

test("ReputationTargetView shows the status in capitals", () => {
  const item = newReputationTarget("code-798", "title-577");
  const view = toReputationTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationTargetViews([item, item]).length, 2, "views");
});
