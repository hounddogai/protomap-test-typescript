import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPathTierEngine } from "./path-tier-engine.js";
import { newPathTier } from "./path-tier.js";

test("PathTierEngine keeps results within bounds", () => {
  const engine = defaultPathTierEngine();
  const item = newPathTier("code-934", "title-535");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
