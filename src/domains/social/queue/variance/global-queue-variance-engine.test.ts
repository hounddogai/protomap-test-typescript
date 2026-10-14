import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalQueueVarianceEngine } from "./global-queue-variance-engine.js";
import { newGlobalQueueVariance } from "./global-queue-variance.js";

test("GlobalQueueVarianceEngine keeps results within bounds", () => {
  const engine = defaultGlobalQueueVarianceEngine(flags.newRegistry());
  const item = newGlobalQueueVariance("code-599", "label-743");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
