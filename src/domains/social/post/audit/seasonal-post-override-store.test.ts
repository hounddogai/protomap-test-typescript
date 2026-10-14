import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPostOverrideStore } from "./seasonal-post-override-store.js";
import { newSeasonalPostOverride } from "./seasonal-post-override.js";

test("MemorySeasonalPostOverrideStore finds what it saved", () => {
  const store = newMemorySeasonalPostOverrideStore();
  const item = newSeasonalPostOverride("code-240", "name-591");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
