import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathBaselineEngine } from "./path-baseline-engine.js";
import { newPathBaseline } from "./path-baseline.js";

test("PathBaselineEngine keeps results within bounds", () => {
  const engine = defaultPathBaselineEngine(flags.newRegistry());
  const item = newPathBaseline("code-802", "label-448");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
