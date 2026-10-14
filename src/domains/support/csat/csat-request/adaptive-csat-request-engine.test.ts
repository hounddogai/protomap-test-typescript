import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveCsatRequestEngine } from "./adaptive-csat-request-engine.js";
import { newAdaptiveCsatRequest } from "./adaptive-csat-request.js";

test("AdaptiveCsatRequestEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveCsatRequestEngine();
  const item = newAdaptiveCsatRequest("code-606", "name-662");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
