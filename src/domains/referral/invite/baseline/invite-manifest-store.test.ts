import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteManifestStore } from "./invite-manifest-store.js";
import { newInviteManifest } from "./invite-manifest.js";

test("MemoryInviteManifestStore finds what it saved", () => {
  const store = newMemoryInviteManifestStore();
  const item = newInviteManifest("code-148", "name-878");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
