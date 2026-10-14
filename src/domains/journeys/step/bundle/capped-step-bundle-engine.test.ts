import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedStepBundleEngine } from "./capped-step-bundle-engine.js";
import { newCappedStepBundle } from "./capped-step-bundle.js";

test("CappedStepBundleEngine keeps results within bounds", () => {
  const engine = defaultCappedStepBundleEngine();
  const item = newCappedStepBundle("code-244", "title-492");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
