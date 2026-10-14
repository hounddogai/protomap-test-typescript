import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedMentionDigestEngine } from "./capped-mention-digest-engine.js";
import { newCappedMentionDigest } from "./capped-mention-digest.js";

test("CappedMentionDigestEngine keeps results within bounds", () => {
  const engine = defaultCappedMentionDigestEngine(flags.newRegistry());
  const item = newCappedMentionDigest("code-901", "label-732");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
