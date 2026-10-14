import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleDigestEngine } from "./bid-rule-digest-engine.js";
import { newBidRuleDigest } from "./bid-rule-digest.js";

test("BidRuleDigestEngine keeps results within bounds", () => {
  const engine = defaultBidRuleDigestEngine(flags.newRegistry());
  const item = newBidRuleDigest("code-203", "title-769");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
