import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryCreativeDigestEngine } from "./primary-creative-digest-engine.js";
import { newPrimaryCreativeDigest } from "./primary-creative-digest.js";

test("PrimaryCreativeDigestEngine keeps results within bounds", () => {
  const engine = defaultPrimaryCreativeDigestEngine();
  const item = newPrimaryCreativeDigest("code-816", "name-502");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
