import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeTemplateStore } from "./challenge-template-store.js";
import { newChallengeTemplate } from "./challenge-template.js";

test("MemoryChallengeTemplateStore finds what it saved", () => {
  const store = newMemoryChallengeTemplateStore();
  const item = newChallengeTemplate("code-972", "label-452");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
