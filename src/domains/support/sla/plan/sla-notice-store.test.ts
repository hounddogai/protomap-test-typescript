import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaNoticeStore } from "./sla-notice-store.js";
import { newSlaNotice } from "./sla-notice.js";

test("MemorySlaNoticeStore finds what it saved", () => {
  const store = newMemorySlaNoticeStore();
  const item = newSlaNotice("code-560", "name-661");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
