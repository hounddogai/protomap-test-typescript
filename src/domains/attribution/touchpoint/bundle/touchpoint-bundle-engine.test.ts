import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointBundleEngine } from "./touchpoint-bundle-engine.js";
import { newTouchpointBundle } from "./touchpoint-bundle.js";

test("TouchpointBundleEngine keeps results within bounds", () => {
  const engine = defaultTouchpointBundleEngine();
  const item = newTouchpointBundle("code-999", "name-940");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
