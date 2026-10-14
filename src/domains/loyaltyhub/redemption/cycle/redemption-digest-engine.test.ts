import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionDigestEngine } from "./redemption-digest-engine.js";
import { newRedemptionDigest } from "./redemption-digest.js";

test("RedemptionDigestEngine keeps results within bounds", () => {
  const engine = defaultRedemptionDigestEngine(flags.newRegistry());
  const item = newRedemptionDigest("code-708", "label-229");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
