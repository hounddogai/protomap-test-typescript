import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyEntryEngine } from "./journey-entry-engine.js";
import { newJourneyEntry } from "./journey-entry.js";

test("JourneyEntryEngine keeps results within bounds", () => {
  const engine = defaultJourneyEntryEngine();
  const item = newJourneyEntry("code-896", "label-540");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
