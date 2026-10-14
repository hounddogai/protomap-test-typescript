import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFlightOverrideStore } from "./primary-flight-override-store.js";
import { newPrimaryFlightOverride } from "./primary-flight-override.js";

test("MemoryPrimaryFlightOverrideStore finds what it saved", () => {
  const store = newMemoryPrimaryFlightOverrideStore();
  const item = newPrimaryFlightOverride("code-530", "label-687");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
