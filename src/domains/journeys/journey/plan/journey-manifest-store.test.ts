import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyManifestStore } from "./journey-manifest-store.js";
import { newJourneyManifest } from "./journey-manifest.js";

test("MemoryJourneyManifestStore finds what it saved", () => {
  const store = newMemoryJourneyManifestStore();
  const item = newJourneyManifest("code-37", "name-959");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
