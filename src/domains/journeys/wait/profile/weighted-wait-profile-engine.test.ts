import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedWaitProfileEngine } from "./weighted-wait-profile-engine.js";
import { newWeightedWaitProfile } from "./weighted-wait-profile.js";

test("WeightedWaitProfileEngine keeps results within bounds", () => {
  const engine = defaultWeightedWaitProfileEngine(flags.newRegistry());
  const item = newWeightedWaitProfile("code-77", "label-547");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
