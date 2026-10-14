import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintBundleEngine } from "./complaint-bundle-engine.js";
import { newComplaintBundle } from "./complaint-bundle.js";

test("ComplaintBundleEngine keeps results within bounds", () => {
  const engine = defaultComplaintBundleEngine();
  const item = newComplaintBundle("code-634", "name-166");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
