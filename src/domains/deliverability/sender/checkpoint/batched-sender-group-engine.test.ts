import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedSenderGroupEngine } from "./batched-sender-group-engine.js";
import { newBatchedSenderGroup } from "./batched-sender-group.js";

test("BatchedSenderGroupEngine keeps results within bounds", () => {
  const engine = defaultBatchedSenderGroupEngine(flags.newRegistry());
  const item = newBatchedSenderGroup("code-917", "name-384");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
