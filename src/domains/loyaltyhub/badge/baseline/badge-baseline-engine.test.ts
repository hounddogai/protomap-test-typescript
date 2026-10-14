import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeBaselineEngine } from "./badge-baseline-engine.js";
import { newBadgeBaseline } from "./badge-baseline.js";

test("BadgeBaselineEngine keeps results within bounds", () => {
  const engine = defaultBadgeBaselineEngine();
  const item = newBadgeBaseline("code-421", "name-361");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
