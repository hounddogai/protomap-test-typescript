import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupPreferenceView, toWarmupPreferenceViews } from "./warmup-preference-view.js";
import { newWarmupPreference } from "./warmup-preference.js";

test("WarmupPreferenceView shows the status in capitals", () => {
  const item = newWarmupPreference("code-404", "label-905");
  const view = toWarmupPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupPreferenceViews([item, item]).length, 2, "views");
});
