import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderBundleStore } from "./sender-bundle-store.js";
import { newSenderBundle } from "./sender-bundle.js";

test("MemorySenderBundleStore finds what it saved", () => {
  const store = newMemorySenderBundleStore();
  const item = newSenderBundle("code-213", "label-207");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
