import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyRedemptionDigestEngine } from "./legacy-redemption-digest-engine.js";
import { newLegacyRedemptionDigest } from "./legacy-redemption-digest.js";

test("LegacyRedemptionDigestEngine keeps results within bounds", () => {
  const engine = defaultLegacyRedemptionDigestEngine(flags.newRegistry());
  const item = newLegacyRedemptionDigest("code-306", "label-678");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
