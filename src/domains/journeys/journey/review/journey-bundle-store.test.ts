import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyBundleStore } from "./journey-bundle-store.js";
import { newJourneyBundle } from "./journey-bundle.js";

test("MemoryJourneyBundleStore finds what it saved", () => {
  const store = newMemoryJourneyBundleStore();
  const item = newJourneyBundle("code-267", "name-268");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
