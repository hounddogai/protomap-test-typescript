import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCreativeGroupStore } from "./legacy-creative-group-store.js";
import { newLegacyCreativeGroup } from "./legacy-creative-group.js";

test("MemoryLegacyCreativeGroupStore finds what it saved", () => {
  const store = newMemoryLegacyCreativeGroupStore();
  const item = newLegacyCreativeGroup("code-21", "name-555");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
