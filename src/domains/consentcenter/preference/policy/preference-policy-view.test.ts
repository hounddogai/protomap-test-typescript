import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferencePolicyView, toPreferencePolicyViews } from "./preference-policy-view.js";
import { newPreferencePolicy } from "./preference-policy.js";

test("PreferencePolicyView shows the status in capitals", () => {
  const item = newPreferencePolicy("code-218", "name-722");
  const view = toPreferencePolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferencePolicyViews([item, item]).length, 2, "views");
});
