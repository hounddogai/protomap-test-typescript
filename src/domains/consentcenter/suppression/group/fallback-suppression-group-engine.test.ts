import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackSuppressionGroupEngine } from "./fallback-suppression-group-engine.js";
import { newFallbackSuppressionGroup } from "./fallback-suppression-group.js";

test("FallbackSuppressionGroupEngine keeps results within bounds", () => {
  const engine = defaultFallbackSuppressionGroupEngine();
  const item = newFallbackSuppressionGroup("code-866", "label-571");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
