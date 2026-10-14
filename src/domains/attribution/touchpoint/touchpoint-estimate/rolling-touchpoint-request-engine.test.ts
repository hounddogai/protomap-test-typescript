import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingTouchpointRequestEngine } from "./rolling-touchpoint-request-engine.js";
import { newRollingTouchpointRequest } from "./rolling-touchpoint-request.js";

test("RollingTouchpointRequestEngine keeps results within bounds", () => {
  const engine = defaultRollingTouchpointRequestEngine();
  const item = newRollingTouchpointRequest("code-222", "title-959");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
