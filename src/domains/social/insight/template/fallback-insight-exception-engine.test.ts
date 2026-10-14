import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackInsightExceptionEngine } from "./fallback-insight-exception-engine.js";
import { newFallbackInsightException } from "./fallback-insight-exception.js";

test("FallbackInsightExceptionEngine keeps results within bounds", () => {
  const engine = defaultFallbackInsightExceptionEngine();
  const item = newFallbackInsightException("code-821", "name-7");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
