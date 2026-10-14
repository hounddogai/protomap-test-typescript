import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFlightBundleStore } from "./rolling-flight-bundle-store.js";
import { newRollingFlightBundle } from "./rolling-flight-bundle.js";

test("MemoryRollingFlightBundleStore finds what it saved", () => {
  const store = newMemoryRollingFlightBundleStore();
  const item = newRollingFlightBundle("code-216", "name-782");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
