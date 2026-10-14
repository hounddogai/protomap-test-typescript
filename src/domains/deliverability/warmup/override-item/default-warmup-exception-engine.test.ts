import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultWarmupExceptionEngine } from "./default-warmup-exception-engine.js";
import { newDefaultWarmupException } from "./default-warmup-exception.js";

test("DefaultWarmupExceptionEngine keeps results within bounds", () => {
  const engine = defaultDefaultWarmupExceptionEngine();
  const item = newDefaultWarmupException("code-459", "name-89");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
