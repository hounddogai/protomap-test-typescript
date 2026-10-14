import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledCreditRollupEngine } from "./scheduled-credit-rollup-engine.js";
import { newScheduledCreditRollup } from "./scheduled-credit-rollup.js";

test("ScheduledCreditRollupEngine keeps results within bounds", () => {
  const engine = defaultScheduledCreditRollupEngine(flags.newRegistry());
  const item = newScheduledCreditRollup("code-570", "title-280");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
