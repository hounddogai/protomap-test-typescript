import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementRollupEngine } from "./placement-rollup-engine.js";
import { newPlacementRollup } from "./placement-rollup.js";

test("PlacementRollupEngine keeps results within bounds", () => {
  const engine = defaultPlacementRollupEngine();
  const item = newPlacementRollup("code-563", "name-727");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
