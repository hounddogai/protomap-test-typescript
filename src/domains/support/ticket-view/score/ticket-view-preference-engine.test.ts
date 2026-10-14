import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewPreferenceEngine } from "./ticket-view-preference-engine.js";
import { newTicketViewPreference } from "./ticket-view-preference.js";

test("TicketViewPreferenceEngine keeps results within bounds", () => {
  const engine = defaultTicketViewPreferenceEngine(flags.newRegistry());
  const item = newTicketViewPreference("code-955", "title-876");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
