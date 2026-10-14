import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingQueueOverrideEngine } from "./rolling-queue-override-engine.js";
import { newRollingQueueOverride } from "./rolling-queue-override.js";

test("RollingQueueOverrideEngine keeps results within bounds", () => {
  const engine = defaultRollingQueueOverrideEngine();
  const item = newRollingQueueOverride("code-986", "name-777");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
