import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationNoticeStore } from "./activation-notice-store.js";
import { newActivationNotice } from "./activation-notice.js";

test("MemoryActivationNoticeStore finds what it saved", () => {
  const store = newMemoryActivationNoticeStore();
  const item = newActivationNotice("code-656", "label-919");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
