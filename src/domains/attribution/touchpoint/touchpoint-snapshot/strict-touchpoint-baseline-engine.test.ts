import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictTouchpointBaselineEngine } from "./strict-touchpoint-baseline-engine.js";
import { newStrictTouchpointBaseline } from "./strict-touchpoint-baseline.js";

test("StrictTouchpointBaselineEngine keeps results within bounds", () => {
  const engine = defaultStrictTouchpointBaselineEngine(flags.newRegistry());
  const item = newStrictTouchpointBaseline("code-298", "name-99");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
