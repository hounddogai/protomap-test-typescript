import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledWindowBatchEngine } from "./scheduled-window-batch-engine.js";
import { newScheduledWindowBatch } from "./scheduled-window-batch.js";

test("ScheduledWindowBatchEngine keeps results within bounds", () => {
  const engine = defaultScheduledWindowBatchEngine(flags.newRegistry());
  const item = newScheduledWindowBatch("code-601", "label-462");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
