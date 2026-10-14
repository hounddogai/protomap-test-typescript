import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptOutExceptionEngine } from "./opt-out-exception-engine.js";
import { newOptOutException } from "./opt-out-exception.js";

test("OptOutExceptionEngine keeps results within bounds", () => {
  const engine = defaultOptOutExceptionEngine();
  const item = newOptOutException("code-431", "label-926");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
