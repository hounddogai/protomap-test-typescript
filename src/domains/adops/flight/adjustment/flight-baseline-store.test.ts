import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightBaselineStore } from "./flight-baseline-store.js";
import { newFlightBaseline } from "./flight-baseline.js";

test("MemoryFlightBaselineStore finds what it saved", () => {
  const store = newMemoryFlightBaselineStore();
  const item = newFlightBaseline("code-810", "name-866");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
