import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedStreakPolicyView, toCappedStreakPolicyViews } from "./capped-streak-policy-view.js";
import { newCappedStreakPolicy } from "./capped-streak-policy.js";

test("CappedStreakPolicyView shows the status in capitals", () => {
  const item = newCappedStreakPolicy("code-14", "label-245");
  const view = toCappedStreakPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedStreakPolicyViews([item, item]).length, 2, "views");
});
