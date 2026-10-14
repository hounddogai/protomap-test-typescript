import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalSlaMilestoneEngine } from "./global-sla-milestone-engine.js";
import { newGlobalSlaMilestone } from "./global-sla-milestone.js";

test("GlobalSlaMilestoneEngine keeps results within bounds", () => {
  const engine = defaultGlobalSlaMilestoneEngine(flags.newRegistry());
  const item = newGlobalSlaMilestone("code-610", "label-606");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
