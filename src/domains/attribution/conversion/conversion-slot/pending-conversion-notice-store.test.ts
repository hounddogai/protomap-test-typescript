import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingConversionNoticeStore } from "./pending-conversion-notice-store.js";
import { newPendingConversionNotice } from "./pending-conversion-notice.js";

test("MemoryPendingConversionNoticeStore finds what it saved", () => {
  const store = newMemoryPendingConversionNoticeStore();
  const item = newPendingConversionNotice("code-123", "title-88");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
