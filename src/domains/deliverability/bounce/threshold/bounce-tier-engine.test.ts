import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBounceTierEngine } from "./bounce-tier-engine.js";
import { newBounceTier } from "./bounce-tier.js";

test("BounceTierEngine keeps results within bounds", () => {
  const engine = defaultBounceTierEngine();
  const item = newBounceTier("code-550", "name-551");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
