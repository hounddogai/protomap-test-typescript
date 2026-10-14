import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalMentionRollupEngine } from "./global-mention-rollup-engine.js";
import { newGlobalMentionRollup } from "./global-mention-rollup.js";

test("GlobalMentionRollupEngine keeps results within bounds", () => {
  const engine = defaultGlobalMentionRollupEngine();
  const item = newGlobalMentionRollup("code-244", "title-583");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
