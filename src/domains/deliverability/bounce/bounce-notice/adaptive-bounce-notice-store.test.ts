import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveBounceNoticeStore } from "./adaptive-bounce-notice-store.js";
import { newAdaptiveBounceNotice } from "./adaptive-bounce-notice.js";

test("MemoryAdaptiveBounceNoticeStore finds what it saved", () => {
  const store = newMemoryAdaptiveBounceNoticeStore();
  const item = newAdaptiveBounceNotice("code-849", "name-951");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
