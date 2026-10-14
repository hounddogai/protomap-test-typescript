import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledReplyOverrideEngine } from "./scheduled-reply-override-engine.js";
import { newScheduledReplyOverride } from "./scheduled-reply-override.js";

test("ScheduledReplyOverrideEngine keeps results within bounds", () => {
  const engine = defaultScheduledReplyOverrideEngine();
  const item = newScheduledReplyOverride("code-852", "label-626");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
