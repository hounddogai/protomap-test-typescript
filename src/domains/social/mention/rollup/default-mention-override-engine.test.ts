import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultMentionOverrideEngine } from "./default-mention-override-engine.js";
import { newDefaultMentionOverride } from "./default-mention-override.js";

test("DefaultMentionOverrideEngine keeps results within bounds", () => {
  const engine = defaultDefaultMentionOverrideEngine();
  const item = newDefaultMentionOverride("code-627", "label-312");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
