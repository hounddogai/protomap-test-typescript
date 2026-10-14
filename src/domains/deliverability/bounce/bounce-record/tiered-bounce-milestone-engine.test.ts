import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredBounceMilestoneEngine } from "./tiered-bounce-milestone-engine.js";
import { newTieredBounceMilestone } from "./tiered-bounce-milestone.js";

test("TieredBounceMilestoneEngine keeps results within bounds", () => {
  const engine = defaultTieredBounceMilestoneEngine(flags.newRegistry());
  const item = newTieredBounceMilestone("code-893", "name-803");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
