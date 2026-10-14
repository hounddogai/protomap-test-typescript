import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedDoubleOptInBundleEngine } from "./capped-double-opt-in-bundle-engine.js";
import { newCappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

test("CappedDoubleOptInBundleEngine keeps results within bounds", () => {
  const engine = defaultCappedDoubleOptInBundleEngine(flags.newRegistry());
  const item = newCappedDoubleOptInBundle("code-956", "title-894");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
