import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionBaselineEngine } from "./retention-baseline-engine.js";
import { newRetentionBaseline } from "./retention-baseline.js";

test("RetentionBaselineEngine keeps results within bounds", () => {
  const engine = defaultRetentionBaselineEngine();
  const item = newRetentionBaseline("code-327", "title-331");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
