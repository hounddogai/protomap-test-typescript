import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalEscalationRollupEngine } from "./seasonal-escalation-rollup-engine.js";
import { newSeasonalEscalationRollup } from "./seasonal-escalation-rollup.js";

test("SeasonalEscalationRollupEngine keeps results within bounds", () => {
  const engine = defaultSeasonalEscalationRollupEngine(flags.newRegistry());
  const item = newSeasonalEscalationRollup("code-34", "title-797");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
