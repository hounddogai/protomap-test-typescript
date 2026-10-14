import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackCreditNoticeStore } from "./fallback-credit-notice-store.js";
import { newFallbackCreditNotice } from "./fallback-credit-notice.js";

test("MemoryFallbackCreditNoticeStore finds what it saved", () => {
  const store = newMemoryFallbackCreditNoticeStore();
  const item = newFallbackCreditNotice("code-959", "name-434");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
