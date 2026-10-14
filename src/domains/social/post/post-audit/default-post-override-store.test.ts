import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPostOverrideStore } from "./default-post-override-store.js";
import { newDefaultPostOverride } from "./default-post-override.js";

test("MemoryDefaultPostOverrideStore finds what it saved", () => {
  const store = newMemoryDefaultPostOverrideStore();
  const item = newDefaultPostOverride("code-582", "title-996");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
