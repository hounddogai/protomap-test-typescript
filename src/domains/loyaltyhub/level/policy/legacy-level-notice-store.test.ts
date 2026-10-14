import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyLevelNoticeStore } from "./legacy-level-notice-store.js";
import { newLegacyLevelNotice } from "./legacy-level-notice.js";

test("MemoryLegacyLevelNoticeStore finds what it saved", () => {
  const store = newMemoryLegacyLevelNoticeStore();
  const item = newLegacyLevelNotice("code-861", "title-321");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
