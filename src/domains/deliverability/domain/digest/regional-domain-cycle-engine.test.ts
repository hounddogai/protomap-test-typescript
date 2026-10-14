import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalDomainCycleEngine } from "./regional-domain-cycle-engine.js";
import { newRegionalDomainCycle } from "./regional-domain-cycle.js";

test("RegionalDomainCycleEngine keeps results within bounds", () => {
  const engine = defaultRegionalDomainCycleEngine();
  const item = newRegionalDomainCycle("code-32", "name-112");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
