import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewGroupEngine } from "./ticket-view-group-engine.js";
import { newTicketViewGroup } from "./ticket-view-group.js";

test("TicketViewGroupEngine keeps results within bounds", () => {
  const engine = defaultTicketViewGroupEngine(flags.newRegistry());
  const item = newTicketViewGroup("code-936", "label-478");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
