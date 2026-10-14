import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalMacroDigestStore } from "./global-macro-digest-store.js";
import { newGlobalMacroDigest } from "./global-macro-digest.js";

test("MemoryGlobalMacroDigestStore finds what it saved", () => {
  const store = newMemoryGlobalMacroDigestStore();
  const item = newGlobalMacroDigest("code-375", "name-785");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
