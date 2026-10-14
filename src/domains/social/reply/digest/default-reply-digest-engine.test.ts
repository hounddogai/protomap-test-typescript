import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultReplyDigestEngine } from "./default-reply-digest-engine.js";
import { newDefaultReplyDigest } from "./default-reply-digest.js";

test("DefaultReplyDigestEngine keeps results within bounds", () => {
  const engine = defaultDefaultReplyDigestEngine();
  const item = newDefaultReplyDigest("code-36", "label-435");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
