import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingChallengeTemplateStore } from "./pending-challenge-template-store.js";
import { newPendingChallengeTemplate } from "./pending-challenge-template.js";

test("MemoryPendingChallengeTemplateStore finds what it saved", () => {
  const store = newMemoryPendingChallengeTemplateStore();
  const item = newPendingChallengeTemplate("code-139", "name-570");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
