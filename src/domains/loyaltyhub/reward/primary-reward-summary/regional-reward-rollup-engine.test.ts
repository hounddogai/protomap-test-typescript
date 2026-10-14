import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalRewardRollupEngine } from "./regional-reward-rollup-engine.js";
import { newRegionalRewardRollup } from "./regional-reward-rollup.js";

test("RegionalRewardRollupEngine keeps results within bounds", () => {
  const engine = defaultRegionalRewardRollupEngine(flags.newRegistry());
  const item = newRegionalRewardRollup("code-922", "title-142");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
