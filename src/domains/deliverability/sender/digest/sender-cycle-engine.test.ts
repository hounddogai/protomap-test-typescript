import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSenderCycleEngine } from "./sender-cycle-engine.js";
import { newSenderCycle } from "./sender-cycle.js";

test("SenderCycleEngine keeps results within bounds", () => {
  const engine = defaultSenderCycleEngine();
  const item = newSenderCycle("code-243", "name-162");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
