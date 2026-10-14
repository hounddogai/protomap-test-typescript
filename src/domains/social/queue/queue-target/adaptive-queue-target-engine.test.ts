import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveQueueTargetEngine } from "./adaptive-queue-target-engine.js";
import { newAdaptiveQueueTarget } from "./adaptive-queue-target.js";

test("AdaptiveQueueTargetEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveQueueTargetEngine(flags.newRegistry());
  const item = newAdaptiveQueueTarget("code-515", "title-296");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
