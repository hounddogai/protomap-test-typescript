import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionRollupEngine } from "./mention-rollup-engine.js";
import { newMentionRollup } from "./mention-rollup.js";

test("MentionRollupEngine keeps results within bounds", () => {
  const engine = defaultMentionRollupEngine();
  const item = newMentionRollup("code-332", "title-953");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
