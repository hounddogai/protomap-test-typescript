import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallBatchEngine } from "./paywall-batch-engine.js";
import { newPaywallBatch } from "./paywall-batch.js";

test("PaywallBatchEngine keeps results within bounds", () => {
  const engine = defaultPaywallBatchEngine();
  const item = newPaywallBatch("code-364", "title-38");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
