import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveBounceGroupEngine } from "./adaptive-bounce-group-engine.js";
import { newAdaptiveBounceGroup } from "./adaptive-bounce-group.js";

test("AdaptiveBounceGroupEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveBounceGroupEngine();
  const item = newAdaptiveBounceGroup("code-1", "title-230");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
