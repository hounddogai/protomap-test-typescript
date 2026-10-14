import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedCreditCheckpointEngine } from "./capped-credit-checkpoint-engine.js";
import { newCappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

test("CappedCreditCheckpointEngine keeps results within bounds", () => {
  const engine = defaultCappedCreditCheckpointEngine(flags.newRegistry());
  const item = newCappedCreditCheckpoint("code-698", "name-274");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
