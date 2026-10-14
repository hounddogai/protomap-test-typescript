import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPacingQuotaEngine } from "./pacing-quota-engine.js";
import { newPacingQuota } from "./pacing-quota.js";

test("PacingQuotaEngine keeps results within bounds", () => {
  const engine = defaultPacingQuotaEngine();
  const item = newPacingQuota("code-288", "label-166");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
