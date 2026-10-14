import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPacingBundleStore } from "./strict-pacing-bundle-store.js";
import { newStrictPacingBundle } from "./strict-pacing-bundle.js";

test("MemoryStrictPacingBundleStore finds what it saved", () => {
  const store = newMemoryStrictPacingBundleStore();
  const item = newStrictPacingBundle("code-578", "name-319");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
