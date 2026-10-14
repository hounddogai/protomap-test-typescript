import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictQueueManifestStore } from "./strict-queue-manifest-store.js";
import { newStrictQueueManifest } from "./strict-queue-manifest.js";

test("MemoryStrictQueueManifestStore finds what it saved", () => {
  const store = newMemoryStrictQueueManifestStore();
  const item = newStrictQueueManifest("code-347", "title-801");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
