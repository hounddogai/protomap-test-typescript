import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueManifestStore } from "./queue-manifest-store.js";
import { newQueueManifest } from "./queue-manifest.js";

test("MemoryQueueManifestStore finds what it saved", () => {
  const store = newMemoryQueueManifestStore();
  const item = newQueueManifest("code-304", "name-175");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
