import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultTicketViewNoticeStore } from "./default-ticket-view-notice-store.js";
import { newDefaultTicketViewNotice } from "./default-ticket-view-notice.js";

test("MemoryDefaultTicketViewNoticeStore finds what it saved", () => {
  const store = newMemoryDefaultTicketViewNoticeStore();
  const item = newDefaultTicketViewNotice("code-265", "name-801");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
