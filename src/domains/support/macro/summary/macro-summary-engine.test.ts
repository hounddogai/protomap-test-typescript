import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMacroSummaryEngine } from "./macro-summary-engine.js";
import { newMacroSummary } from "./macro-summary.js";

test("MacroSummaryEngine keeps results within bounds", () => {
  const engine = defaultMacroSummaryEngine();
  const item = newMacroSummary("code-803", "label-316");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
