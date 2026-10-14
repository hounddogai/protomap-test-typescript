import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientSenderDigestEngine } from "./lenient-sender-digest-engine.js";
import { newLenientSenderDigest } from "./lenient-sender-digest.js";

test("LenientSenderDigestEngine keeps results within bounds", () => {
  const engine = defaultLenientSenderDigestEngine();
  const item = newLenientSenderDigest("code-311", "name-527");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
