import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckNoticeStore } from "./fraud-check-notice-store.js";
import { newFraudCheckNotice } from "./fraud-check-notice.js";

test("MemoryFraudCheckNoticeStore finds what it saved", () => {
  const store = newMemoryFraudCheckNoticeStore();
  const item = newFraudCheckNotice("code-685", "label-497");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
