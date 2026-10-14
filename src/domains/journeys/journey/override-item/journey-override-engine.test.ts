import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyOverrideEngine } from "./journey-override-engine.js";
import { newJourneyOverride } from "./journey-override.js";

test("JourneyOverrideEngine keeps results within bounds", () => {
  const engine = defaultJourneyOverrideEngine();
  const item = newJourneyOverride("code-134", "name-953");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
