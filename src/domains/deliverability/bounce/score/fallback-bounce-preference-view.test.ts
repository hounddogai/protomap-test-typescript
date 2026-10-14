import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackBouncePreferenceView,
  toFallbackBouncePreferenceViews,
} from "./fallback-bounce-preference-view.js";
import { newFallbackBouncePreference } from "./fallback-bounce-preference.js";

test("FallbackBouncePreferenceView shows the status in capitals", () => {
  const item = newFallbackBouncePreference("code-762", "label-40");
  const view = toFallbackBouncePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackBouncePreferenceViews([item, item]).length, 2, "views");
});
