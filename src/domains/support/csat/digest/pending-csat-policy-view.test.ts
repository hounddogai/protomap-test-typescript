import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCsatPolicyView, toPendingCsatPolicyViews } from "./pending-csat-policy-view.js";
import { newPendingCsatPolicy } from "./pending-csat-policy.js";

test("PendingCsatPolicyView shows the status in capitals", () => {
  const item = newPendingCsatPolicy("code-316", "name-459");
  const view = toPendingCsatPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCsatPolicyViews([item, item]).length, 2, "views");
});
