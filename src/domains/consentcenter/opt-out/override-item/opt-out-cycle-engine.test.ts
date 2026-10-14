import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptOutCycleEngine } from "./opt-out-cycle-engine.js";
import { newOptOutCycle } from "./opt-out-cycle.js";

test("OptOutCycleEngine keeps results within bounds", () => {
  const engine = defaultOptOutCycleEngine();
  const item = newOptOutCycle("code-349", "title-617");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
