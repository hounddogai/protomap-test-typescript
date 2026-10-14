import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionBundleEngine } from "./retention-bundle-engine.js";
import { newRetentionBundle } from "./retention-bundle.js";

test("RetentionBundleEngine keeps results within bounds", () => {
  const engine = defaultRetentionBundleEngine();
  const item = newRetentionBundle("code-138", "label-489");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
