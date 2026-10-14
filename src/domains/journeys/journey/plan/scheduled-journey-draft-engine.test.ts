import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledJourneyDraftEngine } from "./scheduled-journey-draft-engine.js";
import { newScheduledJourneyDraft } from "./scheduled-journey-draft.js";

test("ScheduledJourneyDraftEngine keeps results within bounds", () => {
  const engine = defaultScheduledJourneyDraftEngine();
  const item = newScheduledJourneyDraft("code-138", "title-230");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
