import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatBundleStore } from "./csat-bundle-store.js";
import { newCsatBundle } from "./csat-bundle.js";

test("MemoryCsatBundleStore finds what it saved", () => {
  const store = newMemoryCsatBundleStore();
  const item = newCsatBundle("code-250", "title-530");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
