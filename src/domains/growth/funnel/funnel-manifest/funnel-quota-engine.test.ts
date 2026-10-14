import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelQuotaEngine } from "./funnel-quota-engine.js";
import { newFunnelQuota } from "./funnel-quota.js";

test("FunnelQuotaEngine keeps results within bounds", () => {
  const engine = defaultFunnelQuotaEngine();
  const item = newFunnelQuota("code-965", "label-582");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
