import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledCreativeOverrideEngine } from "./scheduled-creative-override-engine.js";
import { newScheduledCreativeOverride } from "./scheduled-creative-override.js";

test("ScheduledCreativeOverrideEngine keeps results within bounds", () => {
  const engine = defaultScheduledCreativeOverrideEngine();
  const item = newScheduledCreativeOverride("code-889", "name-101");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
