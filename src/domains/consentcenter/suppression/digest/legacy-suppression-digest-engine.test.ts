import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacySuppressionDigestEngine } from "./legacy-suppression-digest-engine.js";
import { newLegacySuppressionDigest } from "./legacy-suppression-digest.js";

test("LegacySuppressionDigestEngine keeps results within bounds", () => {
  const engine = defaultLegacySuppressionDigestEngine();
  const item = newLegacySuppressionDigest("code-326", "label-531");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
