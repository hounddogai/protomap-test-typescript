import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalFlightBundleStore } from "./seasonal-flight-bundle-store.js";
import { newSeasonalFlightBundle } from "./seasonal-flight-bundle.js";

test("MemorySeasonalFlightBundleStore finds what it saved", () => {
  const store = newMemorySeasonalFlightBundleStore();
  const item = newSeasonalFlightBundle("code-305", "name-698");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
