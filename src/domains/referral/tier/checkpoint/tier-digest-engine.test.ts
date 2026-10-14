import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierDigestEngine } from "./tier-digest-engine.js";
import { newTierDigest } from "./tier-digest.js";

test("TierDigestEngine keeps results within bounds", () => {
  const engine = defaultTierDigestEngine(flags.newRegistry());
  const item = newTierDigest("code-507", "label-893");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
