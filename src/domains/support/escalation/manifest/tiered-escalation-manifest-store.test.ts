import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredEscalationManifestStore } from "./tiered-escalation-manifest-store.js";
import { newTieredEscalationManifest } from "./tiered-escalation-manifest.js";

test("MemoryTieredEscalationManifestStore finds what it saved", () => {
  const store = newMemoryTieredEscalationManifestStore();
  const item = newTieredEscalationManifest("code-966", "label-140");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
