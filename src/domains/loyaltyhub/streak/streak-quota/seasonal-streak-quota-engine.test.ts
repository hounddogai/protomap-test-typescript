import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalStreakQuotaEngine } from "./seasonal-streak-quota-engine.js";
import { newSeasonalStreakQuota } from "./seasonal-streak-quota.js";

test("SeasonalStreakQuotaEngine keeps results within bounds", () => {
  const engine = defaultSeasonalStreakQuotaEngine(flags.newRegistry());
  const item = newSeasonalStreakQuota("code-14", "label-190");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
