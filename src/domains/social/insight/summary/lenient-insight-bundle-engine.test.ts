import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientInsightBundleEngine } from "./lenient-insight-bundle-engine.js";
import { newLenientInsightBundle } from "./lenient-insight-bundle.js";

test("LenientInsightBundleEngine keeps results within bounds", () => {
  const engine = defaultLenientInsightBundleEngine(flags.newRegistry());
  const item = newLenientInsightBundle("code-553", "name-610");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
