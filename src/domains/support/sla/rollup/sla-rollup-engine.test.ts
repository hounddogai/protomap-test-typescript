import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaRollupEngine } from "./sla-rollup-engine.js";
import { newSlaRollup } from "./sla-rollup.js";

test("SlaRollupEngine keeps results within bounds", () => {
  const engine = defaultSlaRollupEngine(flags.newRegistry());
  const item = newSlaRollup("code-715", "label-270");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
