import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveBadgeQuotaEngine } from "./adaptive-badge-quota-engine.js";
import { newAdaptiveBadgeQuota } from "./adaptive-badge-quota.js";

test("AdaptiveBadgeQuotaEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveBadgeQuotaEngine(flags.newRegistry());
  const item = newAdaptiveBadgeQuota("code-260", "label-662");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
