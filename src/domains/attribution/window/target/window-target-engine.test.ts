import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowTargetEngine } from "./window-target-engine.js";
import { newWindowTarget } from "./window-target.js";

test("WindowTargetEngine keeps results within bounds", () => {
  const engine = defaultWindowTargetEngine();
  const item = newWindowTarget("code-593", "name-164");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
