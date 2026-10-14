import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBounceNoticeStore } from "./manual-bounce-notice-store.js";
import { newManualBounceNotice } from "./manual-bounce-notice.js";

test("MemoryManualBounceNoticeStore finds what it saved", () => {
  const store = newMemoryManualBounceNoticeStore();
  const item = newManualBounceNotice("code-135", "title-747");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
