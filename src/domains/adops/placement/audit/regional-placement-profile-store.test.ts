import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPlacementProfileStore } from "./regional-placement-profile-store.js";
import { newRegionalPlacementProfile } from "./regional-placement-profile.js";

test("MemoryRegionalPlacementProfileStore finds what it saved", () => {
  const store = newMemoryRegionalPlacementProfileStore();
  const item = newRegionalPlacementProfile("code-97", "title-361");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
