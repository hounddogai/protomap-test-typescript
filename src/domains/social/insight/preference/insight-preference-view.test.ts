import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightPreferenceView, toInsightPreferenceViews } from "./insight-preference-view.js";
import { newInsightPreference } from "./insight-preference.js";

test("InsightPreferenceView shows the status in capitals", () => {
  const item = newInsightPreference("code-134", "name-99");
  const view = toInsightPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightPreferenceViews([item, item]).length, 2, "views");
});
