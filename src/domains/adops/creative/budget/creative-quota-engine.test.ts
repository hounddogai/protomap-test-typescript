import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeQuotaEngine } from "./creative-quota-engine.js";
import { newCreativeQuota } from "./creative-quota.js";

test("CreativeQuotaEngine keeps results within bounds", () => {
  const engine = defaultCreativeQuotaEngine();
  const item = newCreativeQuota("code-780", "name-913");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
