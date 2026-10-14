import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostOverrideStore } from "./post-override-store.js";
import { newPostOverride } from "./post-override.js";

test("MemoryPostOverrideStore finds what it saved", () => {
  const store = newMemoryPostOverrideStore();
  const item = newPostOverride("code-844", "title-920");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
