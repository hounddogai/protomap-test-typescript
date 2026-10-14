import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryEscalationWindowStore } from "./primary-escalation-window-store.js";
import { newPrimaryEscalationWindow } from "./primary-escalation-window.js";

test("MemoryPrimaryEscalationWindowStore finds what it saved", () => {
  const store = newMemoryPrimaryEscalationWindowStore();
  const item = newPrimaryEscalationWindow("code-227", "label-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
