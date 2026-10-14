import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatDigestEngine } from "./csat-digest-engine.js";
import { newCsatDigest } from "./csat-digest.js";

test("CsatDigestEngine keeps results within bounds", () => {
  const engine = defaultCsatDigestEngine();
  const item = newCsatDigest("code-264", "label-786");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
