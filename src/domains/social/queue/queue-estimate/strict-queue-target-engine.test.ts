import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictQueueTargetEngine } from "./strict-queue-target-engine.js";
import { newStrictQueueTarget } from "./strict-queue-target.js";

test("StrictQueueTargetEngine keeps results within bounds", () => {
  const engine = defaultStrictQueueTargetEngine(flags.newRegistry());
  const item = newStrictQueueTarget("code-122", "title-797");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
