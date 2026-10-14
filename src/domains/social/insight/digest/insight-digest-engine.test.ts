import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightDigestEngine } from "./insight-digest-engine.js";
import { newInsightDigest } from "./insight-digest.js";

test("InsightDigestEngine keeps results within bounds", () => {
  const engine = defaultInsightDigestEngine();
  const item = newInsightDigest("code-460", "name-219");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
