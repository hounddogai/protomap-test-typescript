import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyDoubleOptInBundleEngine } from "./legacy-double-opt-in-bundle-engine.js";
import { newLegacyDoubleOptInBundle } from "./legacy-double-opt-in-bundle.js";

test("LegacyDoubleOptInBundleEngine keeps results within bounds", () => {
  const engine = defaultLegacyDoubleOptInBundleEngine();
  const item = newLegacyDoubleOptInBundle("code-863", "title-691");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
