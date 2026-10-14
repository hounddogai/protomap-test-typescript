import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCreativeOverrideStore } from "./legacy-creative-override-store.js";
import { newLegacyCreativeOverride } from "./legacy-creative-override.js";

test("MemoryLegacyCreativeOverrideStore finds what it saved", () => {
  const store = newMemoryLegacyCreativeOverrideStore();
  const item = newLegacyCreativeOverride("code-488", "name-77");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
