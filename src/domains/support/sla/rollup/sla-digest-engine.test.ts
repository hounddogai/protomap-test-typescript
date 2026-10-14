import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaDigestEngine } from "./sla-digest-engine.js";
import { newSlaDigest } from "./sla-digest.js";

test("SlaDigestEngine keeps results within bounds", () => {
  const engine = defaultSlaDigestEngine();
  const item = newSlaDigest("code-903", "label-555");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
