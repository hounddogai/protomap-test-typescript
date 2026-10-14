import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationOverrideView, toReputationOverrideViews } from "./reputation-override-view.js";
import { newReputationOverride } from "./reputation-override.js";

test("ReputationOverrideView shows the status in capitals", () => {
  const item = newReputationOverride("code-463", "label-98");
  const view = toReputationOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationOverrideViews([item, item]).length, 2, "views");
});
