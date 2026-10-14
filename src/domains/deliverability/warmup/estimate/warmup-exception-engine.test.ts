import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWarmupExceptionEngine } from "./warmup-exception-engine.js";
import { newWarmupException } from "./warmup-exception.js";

test("WarmupExceptionEngine keeps results within bounds", () => {
  const engine = defaultWarmupExceptionEngine();
  const item = newWarmupException("code-153", "name-525");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
