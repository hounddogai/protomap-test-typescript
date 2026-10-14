import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupNoticeStore } from "./warmup-notice-store.js";
import { newWarmupNotice } from "./warmup-notice.js";

test("MemoryWarmupNoticeStore finds what it saved", () => {
  const store = newMemoryWarmupNoticeStore();
  const item = newWarmupNotice("code-97", "name-320");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
