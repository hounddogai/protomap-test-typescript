import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalSenderBundleEngine } from "./regional-sender-bundle-engine.js";
import { newRegionalSenderBundle } from "./regional-sender-bundle.js";

test("RegionalSenderBundleEngine keeps results within bounds", () => {
  const engine = defaultRegionalSenderBundleEngine();
  const item = newRegionalSenderBundle("code-936", "label-687");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
