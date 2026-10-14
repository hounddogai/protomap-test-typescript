import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyCreativeTargetEngine } from "./legacy-creative-target-engine.js";
import { newLegacyCreativeTarget } from "./legacy-creative-target.js";

test("LegacyCreativeTargetEngine keeps results within bounds", () => {
  const engine = defaultLegacyCreativeTargetEngine();
  const item = newLegacyCreativeTarget("code-204", "title-584");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
