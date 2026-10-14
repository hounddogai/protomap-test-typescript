import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueueProfileEngine } from "./queue-profile-engine.js";
import { newQueueProfile } from "./queue-profile.js";

test("QueueProfileEngine keeps results within bounds", () => {
  const engine = defaultQueueProfileEngine(flags.newRegistry());
  const item = newQueueProfile("code-855", "title-526");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
