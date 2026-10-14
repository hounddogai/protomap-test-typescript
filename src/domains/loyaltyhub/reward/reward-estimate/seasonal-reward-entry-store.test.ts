import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalRewardEntryStore } from "./seasonal-reward-entry-store.js";
import { newSeasonalRewardEntry } from "./seasonal-reward-entry.js";

test("MemorySeasonalRewardEntryStore finds what it saved", () => {
  const store = newMemorySeasonalRewardEntryStore();
  const item = newSeasonalRewardEntry("code-831", "title-451");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
