import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelDigestStore } from "./level-digest-store.js";
import { newLevelDigest } from "./level-digest.js";

test("MemoryLevelDigestStore finds what it saved", () => {
  const store = newMemoryLevelDigestStore();
  const item = newLevelDigest("code-679", "label-785");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
