import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainCycleEngine } from "./domain-cycle-engine.js";
import { newDomainCycle } from "./domain-cycle.js";

test("DomainCycleEngine keeps results within bounds", () => {
  const engine = defaultDomainCycleEngine();
  const item = newDomainCycle("code-707", "name-32");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
