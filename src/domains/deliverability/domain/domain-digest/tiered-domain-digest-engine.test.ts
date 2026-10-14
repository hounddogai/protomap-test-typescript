import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredDomainDigestEngine } from "./tiered-domain-digest-engine.js";
import { newTieredDomainDigest } from "./tiered-domain-digest.js";

test("TieredDomainDigestEngine keeps results within bounds", () => {
  const engine = defaultTieredDomainDigestEngine();
  const item = newTieredDomainDigest("code-223", "label-614");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
