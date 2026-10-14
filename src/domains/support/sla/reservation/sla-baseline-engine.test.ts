import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaBaselineEngine } from "./sla-baseline-engine.js";
import { newSlaBaseline } from "./sla-baseline.js";

test("SlaBaselineEngine keeps results within bounds", () => {
  const engine = defaultSlaBaselineEngine(flags.newRegistry());
  const item = newSlaBaseline("code-873", "name-455");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
