import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointRequestEngine } from "./touchpoint-request-engine.js";
import { newTouchpointRequest } from "./touchpoint-request.js";

test("TouchpointRequestEngine keeps results within bounds", () => {
  const engine = defaultTouchpointRequestEngine();
  const item = newTouchpointRequest("code-139", "name-183");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
