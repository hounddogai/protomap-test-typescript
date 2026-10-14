import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyBundleEngine } from "./journey-bundle-engine.js";
import { newJourneyBundle } from "./journey-bundle.js";

test("JourneyBundleEngine keeps results within bounds", () => {
  const engine = defaultJourneyBundleEngine(flags.newRegistry());
  const item = newJourneyBundle("code-267", "name-268");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
