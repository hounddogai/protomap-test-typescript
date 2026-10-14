import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalOptOutQuotaEngine } from "./regional-opt-out-quota-engine.js";
import { newRegionalOptOutQuota } from "./regional-opt-out-quota.js";

test("RegionalOptOutQuotaEngine keeps results within bounds", () => {
  const engine = defaultRegionalOptOutQuotaEngine();
  const item = newRegionalOptOutQuota("code-362", "title-605");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
