import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaRequestStore } from "./sla-request-store.js";
import { newSlaRequest } from "./sla-request.js";

test("MemorySlaRequestStore finds what it saved", () => {
  const store = newMemorySlaRequestStore();
  const item = newSlaRequest("code-898", "name-10");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
