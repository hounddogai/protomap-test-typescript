import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingQueueGroupEngine } from "./pending-queue-group-engine.js";
import { newPendingQueueGroup } from "./pending-queue-group.js";

test("PendingQueueGroupEngine keeps results within bounds", () => {
  const engine = defaultPendingQueueGroupEngine();
  const item = newPendingQueueGroup("code-280", "label-274");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
