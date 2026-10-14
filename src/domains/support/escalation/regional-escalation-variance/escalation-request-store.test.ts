import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationRequestStore } from "./escalation-request-store.js";
import { newEscalationRequest } from "./escalation-request.js";

test("MemoryEscalationRequestStore finds what it saved", () => {
  const store = newMemoryEscalationRequestStore();
  const item = newEscalationRequest("code-152", "title-229");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
