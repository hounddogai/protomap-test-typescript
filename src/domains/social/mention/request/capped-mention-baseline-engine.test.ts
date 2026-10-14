import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedMentionBaselineEngine } from "./capped-mention-baseline-engine.js";
import { newCappedMentionBaseline } from "./capped-mention-baseline.js";

test("CappedMentionBaselineEngine keeps results within bounds", () => {
  const engine = defaultCappedMentionBaselineEngine();
  const item = newCappedMentionBaseline("code-621", "title-818");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
