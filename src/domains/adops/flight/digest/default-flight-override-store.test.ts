import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFlightOverrideStore } from "./default-flight-override-store.js";
import { newDefaultFlightOverride } from "./default-flight-override.js";

test("MemoryDefaultFlightOverrideStore finds what it saved", () => {
  const store = newMemoryDefaultFlightOverrideStore();
  const item = newDefaultFlightOverride("code-751", "name-876");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
