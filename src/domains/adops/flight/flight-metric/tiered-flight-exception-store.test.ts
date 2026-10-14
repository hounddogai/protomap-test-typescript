import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredFlightExceptionStore } from "./tiered-flight-exception-store.js";
import { newTieredFlightException } from "./tiered-flight-exception.js";

test("MemoryTieredFlightExceptionStore finds what it saved", () => {
  const store = newMemoryTieredFlightExceptionStore();
  const item = newTieredFlightException("code-640", "title-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
