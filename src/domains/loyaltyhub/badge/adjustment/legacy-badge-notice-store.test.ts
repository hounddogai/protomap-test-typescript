import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyBadgeNoticeStore } from "./legacy-badge-notice-store.js";
import { newLegacyBadgeNotice } from "./legacy-badge-notice.js";

test("MemoryLegacyBadgeNoticeStore finds what it saved", () => {
  const store = newMemoryLegacyBadgeNoticeStore();
  const item = newLegacyBadgeNotice("code-490", "label-890");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
