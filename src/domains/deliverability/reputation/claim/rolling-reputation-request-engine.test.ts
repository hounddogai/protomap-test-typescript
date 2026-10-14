import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingReputationRequestEngine } from "./rolling-reputation-request-engine.js";
import { newRollingReputationRequest } from "./rolling-reputation-request.js";

test("RollingReputationRequestEngine keeps results within bounds", () => {
  const engine = defaultRollingReputationRequestEngine();
  const item = newRollingReputationRequest("code-2", "label-816");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
