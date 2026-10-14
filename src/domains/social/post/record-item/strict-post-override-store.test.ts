import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPostOverrideStore } from "./strict-post-override-store.js";
import { newStrictPostOverride } from "./strict-post-override.js";

test("MemoryStrictPostOverrideStore finds what it saved", () => {
  const store = newMemoryStrictPostOverrideStore();
  const item = newStrictPostOverride("code-287", "name-266");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
