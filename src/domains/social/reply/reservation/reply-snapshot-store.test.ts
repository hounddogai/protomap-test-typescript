import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplySnapshotStore } from "./reply-snapshot-store.js";
import { newReplySnapshot } from "./reply-snapshot.js";

test("MemoryReplySnapshotStore finds what it saved", () => {
  const store = newMemoryReplySnapshotStore();
  const item = newReplySnapshot("code-919", "title-188");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
