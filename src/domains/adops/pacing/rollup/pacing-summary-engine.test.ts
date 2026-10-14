import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingSummaryEngine } from "./pacing-summary-engine.js";
import { newPacingSummary } from "./pacing-summary.js";

test("PacingSummaryEngine keeps results within bounds", () => {
  const engine = defaultPacingSummaryEngine(flags.newRegistry());
  const item = newPacingSummary("code-177", "name-505");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
