import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualTicketViewEstimateEngine } from "./manual-ticket-view-estimate-engine.js";
import { newManualTicketViewEstimate } from "./manual-ticket-view-estimate.js";

test("ManualTicketViewEstimateEngine keeps results within bounds", () => {
  const engine = defaultManualTicketViewEstimateEngine(flags.newRegistry());
  const item = newManualTicketViewEstimate("code-500", "title-322");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
