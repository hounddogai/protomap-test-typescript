import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingNudgeTargetEngine } from "./rolling-nudge-target-engine.js";
import { newRollingNudgeTarget } from "./rolling-nudge-target.js";

test("RollingNudgeTargetEngine keeps results within bounds", () => {
  const engine = defaultRollingNudgeTargetEngine();
  const item = newRollingNudgeTarget("code-330", "title-390");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
