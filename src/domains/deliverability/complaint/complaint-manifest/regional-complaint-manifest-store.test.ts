import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalComplaintManifestStore } from "./regional-complaint-manifest-store.js";
import { newRegionalComplaintManifest } from "./regional-complaint-manifest.js";

test("MemoryRegionalComplaintManifestStore finds what it saved", () => {
  const store = newMemoryRegionalComplaintManifestStore();
  const item = newRegionalComplaintManifest("code-247", "label-241");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
