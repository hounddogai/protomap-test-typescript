import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedSenderQuotaEngine } from "./capped-sender-quota-engine.js";
import { newCappedSenderQuota } from "./capped-sender-quota.js";

test("CappedSenderQuotaEngine keeps results within bounds", () => {
  const engine = defaultCappedSenderQuotaEngine();
  const item = newCappedSenderQuota("code-761", "title-857");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
