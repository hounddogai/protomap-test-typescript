import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceBaselineEngine } from "./bounce-baseline-engine.js";
import { newBounceBaseline } from "./bounce-baseline.js";

test("BounceBaselineEngine keeps results within bounds", () => {
  const engine = defaultBounceBaselineEngine(flags.newRegistry());
  const item = newBounceBaseline("code-465", "title-416");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
