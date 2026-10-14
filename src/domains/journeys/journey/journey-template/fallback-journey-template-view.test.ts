import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackJourneyTemplateView, toFallbackJourneyTemplateViews } from "./fallback-journey-template-view.js";
import { newFallbackJourneyTemplate } from "./fallback-journey-template.js";

test("FallbackJourneyTemplateView shows the status in capitals", () => {
  const item = newFallbackJourneyTemplate("code-5", "title-226");
  const view = toFallbackJourneyTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackJourneyTemplateViews([item, item]).length, 2, "views");
});
