import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientConversionPolicyView, toLenientConversionPolicyViews } from "./lenient-conversion-policy-view.js";
import { newLenientConversionPolicy } from "./lenient-conversion-policy.js";

test("LenientConversionPolicyView shows the status in capitals", () => {
  const item = newLenientConversionPolicy("code-21", "name-465");
  const view = toLenientConversionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientConversionPolicyViews([item, item]).length, 2, "views");
});
