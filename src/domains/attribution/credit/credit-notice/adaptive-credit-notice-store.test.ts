import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCreditNoticeStore } from "./adaptive-credit-notice-store.js";
import { newAdaptiveCreditNotice } from "./adaptive-credit-notice.js";

test("MemoryAdaptiveCreditNoticeStore finds what it saved", () => {
  const store = newMemoryAdaptiveCreditNoticeStore();
  const item = newAdaptiveCreditNotice("code-451", "title-88");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
