import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionNoticeStore } from "./conversion-notice-store.js";
import { newConversionNotice } from "./conversion-notice.js";

test("MemoryConversionNoticeStore finds what it saved", () => {
  const store = newMemoryConversionNoticeStore();
  const item = newConversionNotice("code-87", "label-355");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
