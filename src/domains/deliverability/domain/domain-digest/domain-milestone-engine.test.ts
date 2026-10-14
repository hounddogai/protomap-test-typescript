import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainMilestoneEngine } from "./domain-milestone-engine.js";
import { newDomainMilestone } from "./domain-milestone.js";

test("DomainMilestoneEngine keeps results within bounds", () => {
  const engine = defaultDomainMilestoneEngine();
  const item = newDomainMilestone("code-954", "name-850");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
