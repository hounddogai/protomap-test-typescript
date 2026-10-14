import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalLevelOverrideStore } from "./seasonal-level-override-store.js";
import { newSeasonalLevelOverride } from "./seasonal-level-override.js";

test("MemorySeasonalLevelOverrideStore finds what it saved", () => {
  const store = newMemorySeasonalLevelOverrideStore();
  const item = newSeasonalLevelOverride("code-187", "title-622");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
