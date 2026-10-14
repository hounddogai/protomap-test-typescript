import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultMentionAdjustmentEngine } from "./default-mention-adjustment-engine.js";
import { newDefaultMentionAdjustment } from "./default-mention-adjustment.js";

test("DefaultMentionAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultDefaultMentionAdjustmentEngine();
  const item = newDefaultMentionAdjustment("code-954", "title-246");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
