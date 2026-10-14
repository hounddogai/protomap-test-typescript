import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingWindowManifestStore } from "./pending-window-manifest-store.js";
import { newPendingWindowManifest } from "./pending-window-manifest.js";

test("MemoryPendingWindowManifestStore finds what it saved", () => {
  const store = newMemoryPendingWindowManifestStore();
  const item = newPendingWindowManifest("code-137", "title-665");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
