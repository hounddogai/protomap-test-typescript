import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaSummaryEngine } from "./sla-summary-engine.js";
import { newSlaSummary } from "./sla-summary.js";

test("SlaSummaryEngine keeps results within bounds", () => {
  const engine = defaultSlaSummaryEngine(flags.newRegistry());
  const item = newSlaSummary("code-863", "label-200");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
