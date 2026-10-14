import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultStepBundleEngine } from "./default-step-bundle-engine.js";
import { newDefaultStepBundle } from "./default-step-bundle.js";

test("DefaultStepBundleEngine keeps results within bounds", () => {
  const engine = defaultDefaultStepBundleEngine(flags.newRegistry());
  const item = newDefaultStepBundle("code-84", "label-799");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
