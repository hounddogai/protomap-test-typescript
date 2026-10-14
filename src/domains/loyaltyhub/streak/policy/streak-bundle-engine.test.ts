import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakBundleEngine } from "./streak-bundle-engine.js";
import { newStreakBundle } from "./streak-bundle.js";

test("StreakBundleEngine keeps results within bounds", () => {
  const engine = defaultStreakBundleEngine();
  const item = newStreakBundle("code-94", "title-730");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
