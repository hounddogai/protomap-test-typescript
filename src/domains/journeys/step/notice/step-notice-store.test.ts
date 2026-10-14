import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepNoticeStore } from "./step-notice-store.js";
import { newStepNotice } from "./step-notice.js";

test("MemoryStepNoticeStore finds what it saved", () => {
  const store = newMemoryStepNoticeStore();
  const item = newStepNotice("code-137", "name-166");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
