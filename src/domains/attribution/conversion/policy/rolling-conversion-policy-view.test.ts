import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingConversionPolicyView, toRollingConversionPolicyViews } from "./rolling-conversion-policy-view.js";
import { newRollingConversionPolicy } from "./rolling-conversion-policy.js";

test("RollingConversionPolicyView shows the status in capitals", () => {
  const item = newRollingConversionPolicy("code-928", "title-326");
  const view = toRollingConversionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingConversionPolicyViews([item, item]).length, 2, "views");
});
