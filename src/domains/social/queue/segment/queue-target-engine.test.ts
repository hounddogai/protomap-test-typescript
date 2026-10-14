import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueueTargetEngine } from "./queue-target-engine.js";
import { newQueueTarget } from "./queue-target.js";

test("QueueTargetEngine keeps results within bounds", () => {
  const engine = defaultQueueTargetEngine(flags.newRegistry());
  const item = newQueueTarget("code-176", "name-107");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
