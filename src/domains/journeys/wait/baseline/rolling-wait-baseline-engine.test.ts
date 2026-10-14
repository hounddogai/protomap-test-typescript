import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingWaitBaselineEngine } from "./rolling-wait-baseline-engine.js";
import { newRollingWaitBaseline } from "./rolling-wait-baseline.js";

test("RollingWaitBaselineEngine keeps results within bounds", () => {
  const engine = defaultRollingWaitBaselineEngine();
  const item = newRollingWaitBaseline("code-24", "name-369");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
