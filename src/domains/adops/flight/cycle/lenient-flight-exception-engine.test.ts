import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientFlightExceptionEngine } from "./lenient-flight-exception-engine.js";
import { newLenientFlightException } from "./lenient-flight-exception.js";

test("LenientFlightExceptionEngine keeps results within bounds", () => {
  const engine = defaultLenientFlightExceptionEngine();
  const item = newLenientFlightException("code-78", "title-89");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
