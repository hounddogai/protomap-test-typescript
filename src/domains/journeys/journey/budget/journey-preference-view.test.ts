import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyPreferenceView, toJourneyPreferenceViews } from "./journey-preference-view.js";
import { newJourneyPreference } from "./journey-preference.js";

test("JourneyPreferenceView shows the status in capitals", () => {
  const item = newJourneyPreference("code-42", "title-324");
  const view = toJourneyPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyPreferenceViews([item, item]).length, 2, "views");
});
