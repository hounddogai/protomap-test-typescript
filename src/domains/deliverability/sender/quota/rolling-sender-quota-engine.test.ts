import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingSenderQuotaEngine } from "./rolling-sender-quota-engine.js";
import { newRollingSenderQuota } from "./rolling-sender-quota.js";

test("RollingSenderQuotaEngine keeps results within bounds", () => {
  const engine = defaultRollingSenderQuotaEngine(flags.newRegistry());
  const item = newRollingSenderQuota("code-411", "name-934");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
