import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalPaywallDigestEngine } from "./seasonal-paywall-digest-engine.js";
import { newSeasonalPaywallDigest } from "./seasonal-paywall-digest.js";

test("SeasonalPaywallDigestEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPaywallDigestEngine();
  const item = newSeasonalPaywallDigest("code-134", "name-898");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
