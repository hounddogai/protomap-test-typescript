import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientPaywallDigestEngine } from "./lenient-paywall-digest-engine.js";
import { newLenientPaywallDigest } from "./lenient-paywall-digest.js";

test("LenientPaywallDigestEngine keeps results within bounds", () => {
  const engine = defaultLenientPaywallDigestEngine(flags.newRegistry());
  const item = newLenientPaywallDigest("code-812", "label-902");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
