import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryPlacementRollupEngine } from "./primary-placement-rollup-engine.js";
import { newPrimaryPlacementRollup } from "./primary-placement-rollup.js";

test("PrimaryPlacementRollupEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPlacementRollupEngine(flags.newRegistry());
  const item = newPrimaryPlacementRollup("code-286", "name-139");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
