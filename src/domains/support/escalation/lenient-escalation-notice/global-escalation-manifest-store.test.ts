import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalEscalationManifestStore } from "./global-escalation-manifest-store.js";
import { newGlobalEscalationManifest } from "./global-escalation-manifest.js";

test("MemoryGlobalEscalationManifestStore finds what it saved", () => {
  const store = newMemoryGlobalEscalationManifestStore();
  const item = newGlobalEscalationManifest("code-410", "label-333");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
