import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightExceptionStore } from "./flight-exception-store.js";
import { newFlightException } from "./flight-exception.js";

test("MemoryFlightExceptionStore finds what it saved", () => {
  const store = newMemoryFlightExceptionStore();
  const item = newFlightException("code-988", "title-881");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
