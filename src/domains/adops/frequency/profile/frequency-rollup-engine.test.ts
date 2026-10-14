import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFrequencyRollupEngine } from "./frequency-rollup-engine.js";
import { newFrequencyRollup } from "./frequency-rollup.js";

test("FrequencyRollupEngine keeps results within bounds", () => {
  const engine = defaultFrequencyRollupEngine(flags.newRegistry());
  const item = newFrequencyRollup("code-130", "name-815");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
