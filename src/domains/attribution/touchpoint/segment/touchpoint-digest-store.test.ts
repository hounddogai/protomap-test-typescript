import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointDigestStore } from "./touchpoint-digest-store.js";
import { newTouchpointDigest } from "./touchpoint-digest.js";

test("MemoryTouchpointDigestStore finds what it saved", () => {
  const store = newMemoryTouchpointDigestStore();
  const item = newTouchpointDigest("code-469", "name-930");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
