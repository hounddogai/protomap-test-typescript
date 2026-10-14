import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalBadgeBaselineEngine } from "./global-badge-baseline-engine.js";
import { newGlobalBadgeBaseline } from "./global-badge-baseline.js";

test("GlobalBadgeBaselineEngine keeps results within bounds", () => {
  const engine = defaultGlobalBadgeBaselineEngine();
  const item = newGlobalBadgeBaseline("code-634", "label-377");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
