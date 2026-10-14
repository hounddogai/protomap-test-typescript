import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitBundleEngine } from "./wait-bundle-engine.js";
import { newWaitBundle } from "./wait-bundle.js";

test("WaitBundleEngine keeps results within bounds", () => {
  const engine = defaultWaitBundleEngine();
  const item = newWaitBundle("code-435", "name-427");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
