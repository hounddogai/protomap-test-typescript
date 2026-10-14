import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictSlaMilestoneEngine } from "./strict-sla-milestone-engine.js";
import { newStrictSlaMilestone } from "./strict-sla-milestone.js";

test("StrictSlaMilestoneEngine keeps results within bounds", () => {
  const engine = defaultStrictSlaMilestoneEngine(flags.newRegistry());
  const item = newStrictSlaMilestone("code-151", "name-275");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
