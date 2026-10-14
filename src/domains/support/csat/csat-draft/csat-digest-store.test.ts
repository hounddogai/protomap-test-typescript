import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatDigestStore } from "./csat-digest-store.js";
import { newCsatDigest } from "./csat-digest.js";

test("MemoryCsatDigestStore finds what it saved", () => {
  const store = newMemoryCsatDigestStore();
  const item = newCsatDigest("code-264", "label-786");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
