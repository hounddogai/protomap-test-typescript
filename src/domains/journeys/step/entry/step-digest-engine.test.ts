import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepDigestEngine } from "./step-digest-engine.js";
import { newStepDigest } from "./step-digest.js";

test("StepDigestEngine keeps results within bounds", () => {
  const engine = defaultStepDigestEngine();
  const item = newStepDigest("code-363", "label-824");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
