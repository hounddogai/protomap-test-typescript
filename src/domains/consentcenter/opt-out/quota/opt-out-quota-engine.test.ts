import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptOutQuotaEngine } from "./opt-out-quota-engine.js";
import { newOptOutQuota } from "./opt-out-quota.js";

test("OptOutQuotaEngine keeps results within bounds", () => {
  const engine = defaultOptOutQuotaEngine();
  const item = newOptOutQuota("code-605", "title-309");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
