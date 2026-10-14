import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementBundleEngine } from "./placement-bundle-engine.js";
import { newPlacementBundle } from "./placement-bundle.js";

test("PlacementBundleEngine keeps results within bounds", () => {
  const engine = defaultPlacementBundleEngine();
  const item = newPlacementBundle("code-326", "label-434");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
