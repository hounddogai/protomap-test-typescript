import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredPostRollupEngine } from "./tiered-post-rollup-engine.js";
import { newTieredPostRollup } from "./tiered-post-rollup.js";

test("TieredPostRollupEngine keeps results within bounds", () => {
  const engine = defaultTieredPostRollupEngine();
  const item = newTieredPostRollup("code-481", "name-952");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
