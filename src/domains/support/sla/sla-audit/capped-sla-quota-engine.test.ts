import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedSlaQuotaEngine } from "./capped-sla-quota-engine.js";
import { newCappedSlaQuota } from "./capped-sla-quota.js";

test("CappedSlaQuotaEngine keeps results within bounds", () => {
  const engine = defaultCappedSlaQuotaEngine(flags.newRegistry());
  const item = newCappedSlaQuota("code-196", "title-829");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
