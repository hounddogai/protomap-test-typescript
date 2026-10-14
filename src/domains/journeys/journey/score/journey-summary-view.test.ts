import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneySummaryView, toJourneySummaryViews } from "./journey-summary-view.js";
import { newJourneySummary } from "./journey-summary.js";

test("JourneySummaryView shows the status in capitals", () => {
  const item = newJourneySummary("code-892", "name-46");
  const view = toJourneySummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneySummaryViews([item, item]).length, 2, "views");
});
