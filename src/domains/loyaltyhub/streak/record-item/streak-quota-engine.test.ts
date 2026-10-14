import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakQuotaEngine } from "./streak-quota-engine.js";
import { newStreakQuota } from "./streak-quota.js";

test("StreakQuotaEngine keeps results within bounds", () => {
  const engine = defaultStreakQuotaEngine(flags.newRegistry());
  const item = newStreakQuota("code-673", "label-768");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
