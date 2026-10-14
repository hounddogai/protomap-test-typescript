import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeExceptionEngine } from "./creative-exception-engine.js";
import { newCreativeException } from "./creative-exception.js";

test("CreativeExceptionEngine keeps results within bounds", () => {
  const engine = defaultCreativeExceptionEngine();
  const item = newCreativeException("code-919", "name-886");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
