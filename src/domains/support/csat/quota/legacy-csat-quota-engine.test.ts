import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyCsatQuotaEngine } from "./legacy-csat-quota-engine.js";
import { newLegacyCsatQuota } from "./legacy-csat-quota.js";

test("LegacyCsatQuotaEngine keeps results within bounds", () => {
  const engine = defaultLegacyCsatQuotaEngine(flags.newRegistry());
  const item = newLegacyCsatQuota("code-835", "label-509");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
