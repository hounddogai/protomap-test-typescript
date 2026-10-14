import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyBundleStore } from "./reply-bundle-store.js";
import { newReplyBundle } from "./reply-bundle.js";

test("MemoryReplyBundleStore finds what it saved", () => {
  const store = newMemoryReplyBundleStore();
  const item = newReplyBundle("code-432", "label-143");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
