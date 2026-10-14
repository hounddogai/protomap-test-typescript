import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionNoticeStore } from "./retention-notice-store.js";
import { newRetentionNotice } from "./retention-notice.js";

test("MemoryRetentionNoticeStore finds what it saved", () => {
  const store = newMemoryRetentionNoticeStore();
  const item = newRetentionNotice("code-302", "name-628");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
