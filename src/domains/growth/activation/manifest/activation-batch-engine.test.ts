import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationBatchEngine } from "./activation-batch-engine.js";
import { newActivationBatch } from "./activation-batch.js";

test("ActivationBatchEngine keeps results within bounds", () => {
  const engine = defaultActivationBatchEngine(flags.newRegistry());
  const item = newActivationBatch("code-399", "label-786");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
