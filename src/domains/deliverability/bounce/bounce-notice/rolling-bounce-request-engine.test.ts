import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingBounceRequestEngine } from "./rolling-bounce-request-engine.js";
import { newRollingBounceRequest } from "./rolling-bounce-request.js";

test("RollingBounceRequestEngine keeps results within bounds", () => {
  const engine = defaultRollingBounceRequestEngine();
  const item = newRollingBounceRequest("code-132", "label-451");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
