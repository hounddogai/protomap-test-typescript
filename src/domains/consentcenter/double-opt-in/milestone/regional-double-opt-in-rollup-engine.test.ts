import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalDoubleOptInRollupEngine } from "./regional-double-opt-in-rollup-engine.js";
import { newRegionalDoubleOptInRollup } from "./regional-double-opt-in-rollup.js";

test("RegionalDoubleOptInRollupEngine keeps results within bounds", () => {
  const engine = defaultRegionalDoubleOptInRollupEngine(flags.newRegistry());
  const item = newRegionalDoubleOptInRollup("code-675", "title-736");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
