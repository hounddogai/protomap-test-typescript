import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionTierEngine } from "./mention-tier-engine.js";
import { newMentionTier } from "./mention-tier.js";

test("MentionTierEngine keeps results within bounds", () => {
  const engine = defaultMentionTierEngine();
  const item = newMentionTier("code-980", "name-52");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
