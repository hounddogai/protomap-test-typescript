import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveActivationOverrideView,
  toAdaptiveActivationOverrideViews,
} from "./adaptive-activation-override-view.js";
import { newAdaptiveActivationOverride } from "./adaptive-activation-override.js";

test("AdaptiveActivationOverrideView shows the status in capitals", () => {
  const item = newAdaptiveActivationOverride("code-248", "name-558");
  const view = toAdaptiveActivationOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveActivationOverrideViews([item, item]).length, 2, "views");
});
