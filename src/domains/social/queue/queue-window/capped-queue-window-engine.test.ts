import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedQueueWindowEngine } from "./capped-queue-window-engine.js";
import { newCappedQueueWindow } from "./capped-queue-window.js";

test("CappedQueueWindowEngine keeps results within bounds", () => {
  const engine = defaultCappedQueueWindowEngine();
  const item = newCappedQueueWindow("code-176", "name-436");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
