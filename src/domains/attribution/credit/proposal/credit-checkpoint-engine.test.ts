import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditCheckpointEngine } from "./credit-checkpoint-engine.js";
import { newCreditCheckpoint } from "./credit-checkpoint.js";

test("CreditCheckpointEngine keeps results within bounds", () => {
  const engine = defaultCreditCheckpointEngine();
  const item = newCreditCheckpoint("code-925", "name-804");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
