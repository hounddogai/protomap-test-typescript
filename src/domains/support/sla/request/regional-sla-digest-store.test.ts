import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSlaDigestStore } from "./regional-sla-digest-store.js";
import { newRegionalSlaDigest } from "./regional-sla-digest.js";

test("MemoryRegionalSlaDigestStore finds what it saved", () => {
  const store = newMemoryRegionalSlaDigestStore();
  const item = newRegionalSlaDigest("code-50", "name-996");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
