import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientCsatBundleStore } from "./lenient-csat-bundle-store.js";
import { newLenientCsatBundle } from "./lenient-csat-bundle.js";

test("MemoryLenientCsatBundleStore finds what it saved", () => {
  const store = newMemoryLenientCsatBundleStore();
  const item = newLenientCsatBundle("code-592", "title-232");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
