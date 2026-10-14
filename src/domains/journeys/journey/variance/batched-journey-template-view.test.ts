import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedJourneyTemplateView, toBatchedJourneyTemplateViews } from "./batched-journey-template-view.js";
import { newBatchedJourneyTemplate } from "./batched-journey-template.js";

test("BatchedJourneyTemplateView shows the status in capitals", () => {
  const item = newBatchedJourneyTemplate("code-338", "title-425");
  const view = toBatchedJourneyTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedJourneyTemplateViews([item, item]).length, 2, "views");
});
