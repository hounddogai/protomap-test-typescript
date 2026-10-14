import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyReplyDigestEngine } from "./legacy-reply-digest-engine.js";
import { newLegacyReplyDigest } from "./legacy-reply-digest.js";

test("LegacyReplyDigestEngine keeps results within bounds", () => {
  const engine = defaultLegacyReplyDigestEngine();
  const item = newLegacyReplyDigest("code-714", "title-964");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
