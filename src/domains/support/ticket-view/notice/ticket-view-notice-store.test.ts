import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewNoticeStore } from "./ticket-view-notice-store.js";
import { newTicketViewNotice } from "./ticket-view-notice.js";

test("MemoryTicketViewNoticeStore finds what it saved", () => {
  const store = newMemoryTicketViewNoticeStore();
  const item = newTicketViewNotice("code-735", "title-643");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
