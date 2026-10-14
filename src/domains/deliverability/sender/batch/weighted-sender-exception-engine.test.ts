import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedSenderExceptionEngine } from "./weighted-sender-exception-engine.js";
import { newWeightedSenderException } from "./weighted-sender-exception.js";

test("WeightedSenderExceptionEngine keeps results within bounds", () => {
  const engine = defaultWeightedSenderExceptionEngine();
  const item = newWeightedSenderException("code-520", "label-358");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
