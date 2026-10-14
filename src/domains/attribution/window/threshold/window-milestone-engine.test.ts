import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowMilestoneEngine } from "./window-milestone-engine.js";
import { newWindowMilestone } from "./window-milestone.js";

test("WindowMilestoneEngine keeps results within bounds", () => {
  const engine = defaultWindowMilestoneEngine();
  const item = newWindowMilestone("code-620", "label-96");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
