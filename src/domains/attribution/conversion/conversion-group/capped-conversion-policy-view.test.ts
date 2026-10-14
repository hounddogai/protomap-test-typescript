import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedConversionPolicyView, toCappedConversionPolicyViews } from "./capped-conversion-policy-view.js";
import { newCappedConversionPolicy } from "./capped-conversion-policy.js";

test("CappedConversionPolicyView shows the status in capitals", () => {
  const item = newCappedConversionPolicy("code-707", "name-897");
  const view = toCappedConversionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedConversionPolicyViews([item, item]).length, 2, "views");
});
