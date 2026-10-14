import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedCreditOverrideEngine } from "./batched-credit-override-engine.js";
import { newBatchedCreditOverride } from "./batched-credit-override.js";

test("BatchedCreditOverrideEngine keeps results within bounds", () => {
  const engine = defaultBatchedCreditOverrideEngine(flags.newRegistry());
  const item = newBatchedCreditOverride("code-12", "label-254");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
