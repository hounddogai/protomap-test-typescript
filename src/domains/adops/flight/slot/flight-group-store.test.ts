import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightGroupStore } from "./flight-group-store.js";
import { newFlightGroup } from "./flight-group.js";

test("MemoryFlightGroupStore finds what it saved", () => {
  const store = newMemoryFlightGroupStore();
  const item = newFlightGroup("code-598", "label-10");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
