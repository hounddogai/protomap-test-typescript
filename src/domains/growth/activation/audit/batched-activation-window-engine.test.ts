import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedActivationWindowEngine } from "./batched-activation-window-engine.js";
import { newBatchedActivationWindow } from "./batched-activation-window.js";

test("BatchedActivationWindowEngine keeps results within bounds", () => {
  const engine = defaultBatchedActivationWindowEngine(flags.newRegistry());
  const item = newBatchedActivationWindow("code-597", "label-315");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
