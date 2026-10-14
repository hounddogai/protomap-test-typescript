import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSubscriptionBatchEngine } from "./subscription-batch-engine.js";
import { newSubscriptionBatch } from "./subscription-batch.js";

test("SubscriptionBatchEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionBatchEngine(flags.newRegistry());
  const item = newSubscriptionBatch("code-108", "title-491");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
