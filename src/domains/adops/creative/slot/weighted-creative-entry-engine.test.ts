import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedCreativeEntryEngine } from "./weighted-creative-entry-engine.js";
import { newWeightedCreativeEntry } from "./weighted-creative-entry.js";

test("WeightedCreativeEntryEngine keeps results within bounds", () => {
  const engine = defaultWeightedCreativeEntryEngine(flags.newRegistry());
  const item = newWeightedCreativeEntry("code-277", "label-945");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
