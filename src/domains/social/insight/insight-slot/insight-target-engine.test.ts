import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightTargetEngine } from "./insight-target-engine.js";
import { newInsightTarget } from "./insight-target.js";

test("InsightTargetEngine keeps results within bounds", () => {
  const engine = defaultInsightTargetEngine();
  const item = newInsightTarget("code-698", "name-70");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
