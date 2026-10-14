import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaCycleEngine } from "./sla-cycle-engine.js";
import { newSlaCycle } from "./sla-cycle.js";

test("SlaCycleEngine keeps results within bounds", () => {
  const engine = defaultSlaCycleEngine();
  const item = newSlaCycle("code-591", "label-916");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
