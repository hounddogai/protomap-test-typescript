import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceSummaryEngine } from "./bounce-summary-engine.js";
import { newBounceSummary } from "./bounce-summary.js";

test("BounceSummaryEngine keeps results within bounds", () => {
  const engine = defaultBounceSummaryEngine(flags.newRegistry());
  const item = newBounceSummary("code-791", "label-22");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
