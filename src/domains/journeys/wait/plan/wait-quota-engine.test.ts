import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitQuotaEngine } from "./wait-quota-engine.js";
import { newWaitQuota } from "./wait-quota.js";

test("WaitQuotaEngine keeps results within bounds", () => {
  const engine = defaultWaitQuotaEngine();
  const item = newWaitQuota("code-641", "title-416");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
