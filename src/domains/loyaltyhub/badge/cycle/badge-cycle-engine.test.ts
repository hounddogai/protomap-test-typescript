import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeCycleEngine } from "./badge-cycle-engine.js";
import { newBadgeCycle } from "./badge-cycle.js";

test("BadgeCycleEngine keeps results within bounds", () => {
  const engine = defaultBadgeCycleEngine();
  const item = newBadgeCycle("code-162", "label-40");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
