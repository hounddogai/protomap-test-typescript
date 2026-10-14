import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingPolicyView, toPacingPolicyViews } from "./pacing-policy-view.js";
import { newPacingPolicy } from "./pacing-policy.js";

test("PacingPolicyView shows the status in capitals", () => {
  const item = newPacingPolicy("code-110", "label-638");
  const view = toPacingPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingPolicyViews([item, item]).length, 2, "views");
});
