import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalSlaDigestEngine } from "./regional-sla-digest-engine.js";
import { newRegionalSlaDigest } from "./regional-sla-digest.js";

test("RegionalSlaDigestEngine keeps results within bounds", () => {
  const engine = defaultRegionalSlaDigestEngine();
  const item = newRegionalSlaDigest("code-50", "name-996");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
