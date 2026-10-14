import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowDigestStore } from "./window-digest-store.js";
import { newWindowDigest } from "./window-digest.js";

test("MemoryWindowDigestStore finds what it saved", () => {
  const store = newMemoryWindowDigestStore();
  const item = newWindowDigest("code-919", "name-458");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
