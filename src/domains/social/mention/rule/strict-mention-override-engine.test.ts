import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictMentionOverrideEngine } from "./strict-mention-override-engine.js";
import { newStrictMentionOverride } from "./strict-mention-override.js";

test("StrictMentionOverrideEngine keeps results within bounds", () => {
  const engine = defaultStrictMentionOverrideEngine();
  const item = newStrictMentionOverride("code-961", "label-1");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
