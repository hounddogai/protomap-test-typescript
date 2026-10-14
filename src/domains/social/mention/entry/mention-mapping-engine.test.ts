import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionMappingEngine } from "./mention-mapping-engine.js";
import { newMentionMapping } from "./mention-mapping.js";

test("MentionMappingEngine keeps results within bounds", () => {
  const engine = defaultMentionMappingEngine();
  const item = newMentionMapping("code-891", "name-893");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
