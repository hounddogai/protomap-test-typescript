import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictInsightRollupEngine } from "./strict-insight-rollup-engine.js";
import { newStrictInsightRollup } from "./strict-insight-rollup.js";

test("StrictInsightRollupEngine keeps results within bounds", () => {
  const engine = defaultStrictInsightRollupEngine(flags.newRegistry());
  const item = newStrictInsightRollup("code-160", "label-233");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
