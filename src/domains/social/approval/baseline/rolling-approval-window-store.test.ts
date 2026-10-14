import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingApprovalWindowStore } from "./rolling-approval-window-store.js";
import { newRollingApprovalWindow } from "./rolling-approval-window.js";

test("MemoryRollingApprovalWindowStore finds what it saved", () => {
  const store = newMemoryRollingApprovalWindowStore();
  const item = newRollingApprovalWindow("code-7", "name-705");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
