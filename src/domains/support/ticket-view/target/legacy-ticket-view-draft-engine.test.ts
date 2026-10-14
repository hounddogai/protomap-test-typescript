import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyTicketViewDraftEngine } from "./legacy-ticket-view-draft-engine.js";
import { newLegacyTicketViewDraft } from "./legacy-ticket-view-draft.js";

test("LegacyTicketViewDraftEngine keeps results within bounds", () => {
  const engine = defaultLegacyTicketViewDraftEngine(flags.newRegistry());
  const item = newLegacyTicketViewDraft("code-452", "title-487");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
