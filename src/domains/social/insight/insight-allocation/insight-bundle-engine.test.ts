import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightBundleEngine } from "./insight-bundle-engine.js";
import { newInsightBundle } from "./insight-bundle.js";

test("InsightBundleEngine keeps results within bounds", () => {
  const engine = defaultInsightBundleEngine(flags.newRegistry());
  const item = newInsightBundle("code-451", "name-839");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
