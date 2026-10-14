import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalOptOutBundleEngine } from "./regional-opt-out-bundle-engine.js";
import { newRegionalOptOutBundle } from "./regional-opt-out-bundle.js";

test("RegionalOptOutBundleEngine keeps results within bounds", () => {
  const engine = defaultRegionalOptOutBundleEngine(flags.newRegistry());
  const item = newRegionalOptOutBundle("code-172", "name-186");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
