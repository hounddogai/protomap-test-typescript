import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackPathQuotaEngine } from "./fallback-path-quota-engine.js";
import { newFallbackPathQuota } from "./fallback-path-quota.js";

test("FallbackPathQuotaEngine keeps results within bounds", () => {
  const engine = defaultFallbackPathQuotaEngine(flags.newRegistry());
  const item = newFallbackPathQuota("code-605", "label-177");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
