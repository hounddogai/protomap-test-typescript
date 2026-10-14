import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathOverrideStore } from "./path-override-store.js";
import { newPathOverride } from "./path-override.js";

test("MemoryPathOverrideStore finds what it saved", () => {
  const store = newMemoryPathOverrideStore();
  const item = newPathOverride("code-139", "title-496");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
