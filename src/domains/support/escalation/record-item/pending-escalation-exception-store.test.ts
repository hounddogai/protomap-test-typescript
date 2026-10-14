import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingEscalationExceptionStore } from "./pending-escalation-exception-store.js";
import { newPendingEscalationException } from "./pending-escalation-exception.js";

test("MemoryPendingEscalationExceptionStore finds what it saved", () => {
  const store = newMemoryPendingEscalationExceptionStore();
  const item = newPendingEscalationException("code-248", "label-655");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
