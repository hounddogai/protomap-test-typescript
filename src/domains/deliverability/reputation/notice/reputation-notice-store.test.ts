import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationNoticeStore } from "./reputation-notice-store.js";
import { newReputationNotice } from "./reputation-notice.js";

test("MemoryReputationNoticeStore finds what it saved", () => {
  const store = newMemoryReputationNoticeStore();
  const item = newReputationNotice("code-544", "label-432");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
