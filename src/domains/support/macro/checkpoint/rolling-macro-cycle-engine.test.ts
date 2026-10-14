import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingMacroCycleEngine } from "./rolling-macro-cycle-engine.js";
import { newRollingMacroCycle } from "./rolling-macro-cycle.js";

test("RollingMacroCycleEngine keeps results within bounds", () => {
  const engine = defaultRollingMacroCycleEngine();
  const item = newRollingMacroCycle("code-273", "label-872");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
