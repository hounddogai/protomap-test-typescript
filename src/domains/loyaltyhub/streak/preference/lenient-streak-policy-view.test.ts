import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientStreakPolicyView, toLenientStreakPolicyViews } from "./lenient-streak-policy-view.js";
import { newLenientStreakPolicy } from "./lenient-streak-policy.js";

test("LenientStreakPolicyView shows the status in capitals", () => {
  const item = newLenientStreakPolicy("code-668", "title-527");
  const view = toLenientStreakPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientStreakPolicyViews([item, item]).length, 2, "views");
});
