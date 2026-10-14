import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeRequestStore } from "./nudge-request-store.js";
import { newNudgeRequest } from "./nudge-request.js";

test("MemoryNudgeRequestStore finds what it saved", () => {
  const store = newMemoryNudgeRequestStore();
  const item = newNudgeRequest("code-437", "name-228");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
