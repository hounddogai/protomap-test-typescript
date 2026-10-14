import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQueueEntryEngine } from "./queue-entry-engine.js";
import { newQueueEntry } from "./queue-entry.js";

test("QueueEntryEngine keeps results within bounds", () => {
  const engine = defaultQueueEntryEngine();
  const item = newQueueEntry("code-282", "name-366");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
