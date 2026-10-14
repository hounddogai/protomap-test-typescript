import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalNudgeWindowStore } from "./seasonal-nudge-window-store.js";
import { newSeasonalNudgeWindow } from "./seasonal-nudge-window.js";

test("MemorySeasonalNudgeWindowStore finds what it saved", () => {
  const store = newMemorySeasonalNudgeWindowStore();
  const item = newSeasonalNudgeWindow("code-662", "title-83");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
