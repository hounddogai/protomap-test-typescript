import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPacingSummaryEngine } from "./default-pacing-summary-engine.js";
import { newDefaultPacingSummary } from "./default-pacing-summary.js";

test("DefaultPacingSummaryEngine keeps results within bounds", () => {
  const engine = defaultDefaultPacingSummaryEngine(flags.newRegistry());
  const item = newDefaultPacingSummary("code-563", "label-729");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
