import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepBundleEngine } from "./step-bundle-engine.js";
import { newStepBundle } from "./step-bundle.js";

test("StepBundleEngine keeps results within bounds", () => {
  const engine = defaultStepBundleEngine(flags.newRegistry());
  const item = newStepBundle("code-431", "title-583");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
