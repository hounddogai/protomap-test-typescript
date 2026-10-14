import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallDigestEngine } from "./paywall-digest-engine.js";
import { newPaywallDigest } from "./paywall-digest.js";

test("PaywallDigestEngine keeps results within bounds", () => {
  const engine = defaultPaywallDigestEngine();
  const item = newPaywallDigest("code-477", "label-705");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
