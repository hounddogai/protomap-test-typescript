import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleManifestEngine } from "./bid-rule-manifest-engine.js";
import { newBidRuleManifest } from "./bid-rule-manifest.js";

test("BidRuleManifestEngine keeps results within bounds", () => {
  const engine = defaultBidRuleManifestEngine();
  const item = newBidRuleManifest("code-729", "label-906");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
