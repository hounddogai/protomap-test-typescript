import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedWindowRequestStore } from "./capped-window-request-store.js";
import { newCappedWindowRequest } from "./capped-window-request.js";

test("MemoryCappedWindowRequestStore finds what it saved", () => {
  const store = newMemoryCappedWindowRequestStore();
  const item = newCappedWindowRequest("code-550", "title-357");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
