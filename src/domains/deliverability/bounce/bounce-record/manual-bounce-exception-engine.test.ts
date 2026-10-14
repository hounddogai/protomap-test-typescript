import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualBounceExceptionEngine } from "./manual-bounce-exception-engine.js";
import { newManualBounceException } from "./manual-bounce-exception.js";

test("ManualBounceExceptionEngine keeps results within bounds", () => {
  const engine = defaultManualBounceExceptionEngine();
  const item = newManualBounceException("code-619", "title-615");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
