import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathDigestStore } from "./path-digest-store.js";
import { newPathDigest } from "./path-digest.js";

test("MemoryPathDigestStore finds what it saved", () => {
  const store = newMemoryPathDigestStore();
  const item = newPathDigest("code-288", "name-712");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
