import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalReplyDigestEngine } from "./regional-reply-digest-engine.js";
import { newRegionalReplyDigest } from "./regional-reply-digest.js";

test("RegionalReplyDigestEngine keeps results within bounds", () => {
  const engine = defaultRegionalReplyDigestEngine(flags.newRegistry());
  const item = newRegionalReplyDigest("code-757", "name-151");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
