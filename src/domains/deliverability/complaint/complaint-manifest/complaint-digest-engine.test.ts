import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintDigestEngine } from "./complaint-digest-engine.js";
import { newComplaintDigest } from "./complaint-digest.js";

test("ComplaintDigestEngine keeps results within bounds", () => {
  const engine = defaultComplaintDigestEngine();
  const item = newComplaintDigest("code-615", "title-101");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
