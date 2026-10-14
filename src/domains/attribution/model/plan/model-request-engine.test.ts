import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelRequestEngine } from "./model-request-engine.js";
import { newModelRequest } from "./model-request.js";

test("ModelRequestEngine keeps results within bounds", () => {
  const engine = defaultModelRequestEngine();
  const item = newModelRequest("code-93", "label-647");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
