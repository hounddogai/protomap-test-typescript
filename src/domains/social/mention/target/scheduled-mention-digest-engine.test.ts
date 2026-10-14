import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledMentionDigestEngine } from "./scheduled-mention-digest-engine.js";
import { newScheduledMentionDigest } from "./scheduled-mention-digest.js";

test("ScheduledMentionDigestEngine keeps results within bounds", () => {
  const engine = defaultScheduledMentionDigestEngine(flags.newRegistry());
  const item = newScheduledMentionDigest("code-280", "label-702");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
