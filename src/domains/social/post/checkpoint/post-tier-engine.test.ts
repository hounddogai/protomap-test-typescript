import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostTierEngine } from "./post-tier-engine.js";
import { newPostTier } from "./post-tier.js";

test("PostTierEngine keeps results within bounds", () => {
  const engine = defaultPostTierEngine();
  const item = newPostTier("code-900", "name-670");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
