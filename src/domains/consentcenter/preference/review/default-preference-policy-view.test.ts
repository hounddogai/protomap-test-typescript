import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultPreferencePolicyView, toDefaultPreferencePolicyViews } from "./default-preference-policy-view.js";
import { newDefaultPreferencePolicy } from "./default-preference-policy.js";

test("DefaultPreferencePolicyView shows the status in capitals", () => {
  const item = newDefaultPreferencePolicy("code-239", "title-235");
  const view = toDefaultPreferencePolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPreferencePolicyViews([item, item]).length, 2, "views");
});
