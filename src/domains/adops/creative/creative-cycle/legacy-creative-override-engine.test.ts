import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyCreativeOverrideEngine } from "./legacy-creative-override-engine.js";
import { newLegacyCreativeOverride } from "./legacy-creative-override.js";

test("LegacyCreativeOverrideEngine keeps results within bounds", () => {
  const engine = defaultLegacyCreativeOverrideEngine();
  const item = newLegacyCreativeOverride("code-488", "name-77");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
