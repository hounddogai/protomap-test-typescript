import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSenderScoreStore } from "./default-sender-score-store.js";
import { newDefaultSenderScore } from "./default-sender-score.js";

test("MemoryDefaultSenderScoreStore finds what it saved", () => {
  const store = newMemoryDefaultSenderScoreStore();
  const item = newDefaultSenderScore("code-382", "title-126");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
