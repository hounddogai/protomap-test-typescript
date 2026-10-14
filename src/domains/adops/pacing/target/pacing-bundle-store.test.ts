import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingBundleStore } from "./pacing-bundle-store.js";
import { newPacingBundle } from "./pacing-bundle.js";

test("MemoryPacingBundleStore finds what it saved", () => {
  const store = newMemoryPacingBundleStore();
  const item = newPacingBundle("code-694", "label-822");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
