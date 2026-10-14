import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightWindowStore } from "./flight-window-store.js";
import { newFlightWindow } from "./flight-window.js";

test("MemoryFlightWindowStore finds what it saved", () => {
  const store = newMemoryFlightWindowStore();
  const item = newFlightWindow("code-604", "title-494");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
