import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalProofBundleEngine } from "./seasonal-proof-bundle-engine.js";
import { newSeasonalProofBundle } from "./seasonal-proof-bundle.js";

test("SeasonalProofBundleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalProofBundleEngine();
  const item = newSeasonalProofBundle("code-158", "label-461");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
