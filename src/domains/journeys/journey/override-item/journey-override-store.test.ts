import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyOverrideStore } from "./journey-override-store.js";
import { newJourneyOverride } from "./journey-override.js";

test("MemoryJourneyOverrideStore finds what it saved", () => {
  const store = newMemoryJourneyOverrideStore();
  const item = newJourneyOverride("code-134", "name-953");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
