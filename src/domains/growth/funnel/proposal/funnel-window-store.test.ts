import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelWindowStore } from "./funnel-window-store.js";
import { newFunnelWindow } from "./funnel-window.js";

test("MemoryFunnelWindowStore finds what it saved", () => {
  const store = newMemoryFunnelWindowStore();
  const item = newFunnelWindow("code-147", "name-997");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
