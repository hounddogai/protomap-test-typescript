import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingRewardRollupEngine } from "./pending-reward-rollup-engine.js";
import { newPendingRewardRollup } from "./pending-reward-rollup.js";

test("PendingRewardRollupEngine keeps results within bounds", () => {
  const engine = defaultPendingRewardRollupEngine(flags.newRegistry());
  const item = newPendingRewardRollup("code-755", "title-597");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
