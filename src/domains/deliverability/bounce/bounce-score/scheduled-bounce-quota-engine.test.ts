import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledBounceQuotaEngine } from "./scheduled-bounce-quota-engine.js";
import { newScheduledBounceQuota } from "./scheduled-bounce-quota.js";

test("ScheduledBounceQuotaEngine keeps results within bounds", () => {
  const engine = defaultScheduledBounceQuotaEngine();
  const item = newScheduledBounceQuota("code-663", "label-647");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
