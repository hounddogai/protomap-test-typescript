import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSubscriptionCheckpointEngine } from "./subscription-checkpoint-engine.js";
import { newSubscriptionCheckpoint } from "./subscription-checkpoint.js";

test("SubscriptionCheckpointEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionCheckpointEngine(flags.newRegistry());
  const item = newSubscriptionCheckpoint("code-628", "label-305");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
