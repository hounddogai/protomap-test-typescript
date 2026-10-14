import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedJourneyTemplateView, toWeightedJourneyTemplateViews } from "./weighted-journey-template-view.js";
import { newWeightedJourneyTemplate } from "./weighted-journey-template.js";

test("WeightedJourneyTemplateView shows the status in capitals", () => {
  const item = newWeightedJourneyTemplate("code-19", "label-465");
  const view = toWeightedJourneyTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedJourneyTemplateViews([item, item]).length, 2, "views");
});
