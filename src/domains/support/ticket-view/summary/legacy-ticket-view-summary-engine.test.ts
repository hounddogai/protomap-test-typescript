import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyTicketViewSummaryEngine } from "./legacy-ticket-view-summary-engine.js";
import { newLegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

test("LegacyTicketViewSummaryEngine keeps results within bounds", () => {
  const engine = defaultLegacyTicketViewSummaryEngine();
  const item = newLegacyTicketViewSummary("code-178", "title-234");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
