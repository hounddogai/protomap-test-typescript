import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaWindowStore } from "./sla-window-store.js";
import { newSlaWindow } from "./sla-window.js";

test("MemorySlaWindowStore finds what it saved", () => {
  const store = newMemorySlaWindowStore();
  const item = newSlaWindow("code-699", "label-140");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
