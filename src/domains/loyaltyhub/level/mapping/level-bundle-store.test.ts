import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelBundleStore } from "./level-bundle-store.js";
import { newLevelBundle } from "./level-bundle.js";

test("MemoryLevelBundleStore finds what it saved", () => {
  const store = newMemoryLevelBundleStore();
  const item = newLevelBundle("code-696", "title-927");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
