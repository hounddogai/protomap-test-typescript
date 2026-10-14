import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyManifestStore } from "./reply-manifest-store.js";
import { newReplyManifest } from "./reply-manifest.js";

test("MemoryReplyManifestStore finds what it saved", () => {
  const store = newMemoryReplyManifestStore();
  const item = newReplyManifest("code-655", "name-501");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
