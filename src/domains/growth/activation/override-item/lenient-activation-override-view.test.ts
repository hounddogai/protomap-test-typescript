import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientActivationOverrideView,
  toLenientActivationOverrideViews,
} from "./lenient-activation-override-view.js";
import { newLenientActivationOverride } from "./lenient-activation-override.js";

test("LenientActivationOverrideView shows the status in capitals", () => {
  const item = newLenientActivationOverride("code-389", "name-483");
  const view = toLenientActivationOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientActivationOverrideViews([item, item]).length, 2, "views");
});
