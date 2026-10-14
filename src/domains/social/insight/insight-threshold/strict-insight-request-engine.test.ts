import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictInsightRequestEngine } from "./strict-insight-request-engine.js";
import { newStrictInsightRequest } from "./strict-insight-request.js";

test("StrictInsightRequestEngine keeps results within bounds", () => {
  const engine = defaultStrictInsightRequestEngine();
  const item = newStrictInsightRequest("code-603", "title-234");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
