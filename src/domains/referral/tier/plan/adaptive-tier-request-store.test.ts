import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveTierRequestStore } from "./adaptive-tier-request-store.js";
import { newAdaptiveTierRequest } from "./adaptive-tier-request.js";

test("MemoryAdaptiveTierRequestStore finds what it saved", () => {
  const store = newMemoryAdaptiveTierRequestStore();
  const item = newAdaptiveTierRequest("code-172", "title-822");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
