import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInPolicyView, toDoubleOptInPolicyViews } from "./double-opt-in-policy-view.js";
import { newDoubleOptInPolicy } from "./double-opt-in-policy.js";

test("DoubleOptInPolicyView shows the status in capitals", () => {
  const item = newDoubleOptInPolicy("code-800", "label-954");
  const view = toDoubleOptInPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInPolicyViews([item, item]).length, 2, "views");
});
