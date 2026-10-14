import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultFrequencyCycleEngine } from "./default-frequency-cycle-engine.js";
import { newDefaultFrequencyCycle } from "./default-frequency-cycle.js";

test("DefaultFrequencyCycleEngine keeps results within bounds", () => {
  const engine = defaultDefaultFrequencyCycleEngine(flags.newRegistry());
  const item = newDefaultFrequencyCycle("code-764", "title-906");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
