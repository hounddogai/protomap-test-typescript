import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultTicketViewNoticeEngine } from "./default-ticket-view-notice-engine.js";
import { newDefaultTicketViewNotice } from "./default-ticket-view-notice.js";

test("DefaultTicketViewNoticeEngine keeps results within bounds", () => {
  const engine = defaultDefaultTicketViewNoticeEngine();
  const item = newDefaultTicketViewNotice("code-265", "name-801");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
