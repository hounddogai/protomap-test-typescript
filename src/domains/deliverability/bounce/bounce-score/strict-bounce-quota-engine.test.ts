import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictBounceQuotaEngine } from "./strict-bounce-quota-engine.js";
import { newStrictBounceQuota } from "./strict-bounce-quota.js";

test("StrictBounceQuotaEngine keeps results within bounds", () => {
  const engine = defaultStrictBounceQuotaEngine();
  const item = newStrictBounceQuota("code-950", "name-234");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
