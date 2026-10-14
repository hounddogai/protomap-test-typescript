import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualTicketViewTierEngine } from "./manual-ticket-view-tier-engine.js";
import { newManualTicketViewTier } from "./manual-ticket-view-tier.js";

test("ManualTicketViewTierEngine keeps results within bounds", () => {
  const engine = defaultManualTicketViewTierEngine(flags.newRegistry());
  const item = newManualTicketViewTier("code-770", "name-876");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
