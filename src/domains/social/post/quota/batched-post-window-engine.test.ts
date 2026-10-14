import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedPostWindowEngine } from "./batched-post-window-engine.js";
import { newBatchedPostWindow } from "./batched-post-window.js";

test("BatchedPostWindowEngine keeps results within bounds", () => {
  const engine = defaultBatchedPostWindowEngine(flags.newRegistry());
  const item = newBatchedPostWindow("code-316", "label-114");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
