import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaDigestStore } from "./sla-digest-store.js";
import { newSlaDigest } from "./sla-digest.js";

test("MemorySlaDigestStore finds what it saved", () => {
  const store = newMemorySlaDigestStore();
  const item = newSlaDigest("code-903", "label-555");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
