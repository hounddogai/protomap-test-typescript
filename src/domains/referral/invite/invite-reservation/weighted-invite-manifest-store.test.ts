import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedInviteManifestStore } from "./weighted-invite-manifest-store.js";
import { newWeightedInviteManifest } from "./weighted-invite-manifest.js";

test("MemoryWeightedInviteManifestStore finds what it saved", () => {
  const store = newMemoryWeightedInviteManifestStore();
  const item = newWeightedInviteManifest("code-246", "name-349");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
