import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightRequestStore } from "./flight-request-store.js";
import { newFlightRequest } from "./flight-request.js";

test("MemoryFlightRequestStore finds what it saved", () => {
  const store = newMemoryFlightRequestStore();
  const item = newFlightRequest("code-651", "name-206");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
