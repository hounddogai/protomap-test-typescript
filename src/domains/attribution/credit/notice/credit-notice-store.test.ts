import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditNoticeStore } from "./credit-notice-store.js";
import { newCreditNotice } from "./credit-notice.js";

test("MemoryCreditNoticeStore finds what it saved", () => {
  const store = newMemoryCreditNoticeStore();
  const item = newCreditNotice("code-155", "label-493");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
