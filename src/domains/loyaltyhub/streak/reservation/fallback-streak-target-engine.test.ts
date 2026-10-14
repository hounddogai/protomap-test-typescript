import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackStreakTargetEngine } from "./fallback-streak-target-engine.js";
import { newFallbackStreakTarget } from "./fallback-streak-target.js";

test("FallbackStreakTargetEngine keeps results within bounds", () => {
  const engine = defaultFallbackStreakTargetEngine(flags.newRegistry());
  const item = newFallbackStreakTarget("code-237", "name-269");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
