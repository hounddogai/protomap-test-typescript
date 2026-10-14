import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationManifestStore } from "./escalation-manifest-store.js";
import { newEscalationManifest } from "./escalation-manifest.js";

test("MemoryEscalationManifestStore finds what it saved", () => {
  const store = newMemoryEscalationManifestStore();
  const item = newEscalationManifest("code-340", "name-735");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
