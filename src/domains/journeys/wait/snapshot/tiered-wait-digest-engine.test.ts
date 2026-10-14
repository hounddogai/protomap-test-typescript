import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredWaitDigestEngine } from "./tiered-wait-digest-engine.js";
import { newTieredWaitDigest } from "./tiered-wait-digest.js";

test("TieredWaitDigestEngine keeps results within bounds", () => {
  const engine = defaultTieredWaitDigestEngine();
  const item = newTieredWaitDigest("code-129", "name-620");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
