import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSenderScoreStore } from "./regional-sender-score-store.js";
import { newRegionalSenderScore } from "./regional-sender-score.js";

test("MemoryRegionalSenderScoreStore finds what it saved", () => {
  const store = newMemoryRegionalSenderScoreStore();
  const item = newRegionalSenderScore("code-175", "name-811");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
