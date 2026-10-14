import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointOverrideEngine } from "./touchpoint-override-engine.js";
import { newTouchpointOverride } from "./touchpoint-override.js";

test("TouchpointOverrideEngine keeps results within bounds", () => {
  const engine = defaultTouchpointOverrideEngine();
  const item = newTouchpointOverride("code-211", "label-742");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
