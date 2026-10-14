import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalPlacementQuotaEngine } from "./global-placement-quota-engine.js";
import { newGlobalPlacementQuota } from "./global-placement-quota.js";

test("GlobalPlacementQuotaEngine keeps results within bounds", () => {
  const engine = defaultGlobalPlacementQuotaEngine(flags.newRegistry());
  const item = newGlobalPlacementQuota("code-526", "name-170");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
