import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceCycleEngine } from "./preference-cycle-engine.js";
import { newPreferenceCycle } from "./preference-cycle.js";

test("PreferenceCycleEngine keeps results within bounds", () => {
  const engine = defaultPreferenceCycleEngine(flags.newRegistry());
  const item = newPreferenceCycle("code-158", "name-211");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
