import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingStreakBundleEngine } from "./pending-streak-bundle-engine.js";
import { newPendingStreakBundle } from "./pending-streak-bundle.js";

test("PendingStreakBundleEngine keeps results within bounds", () => {
  const engine = defaultPendingStreakBundleEngine();
  const item = newPendingStreakBundle("code-646", "label-896");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
