import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeManifestStore } from "./nudge-manifest-store.js";
import { newNudgeManifest } from "./nudge-manifest.js";

test("MemoryNudgeManifestStore finds what it saved", () => {
  const store = newMemoryNudgeManifestStore();
  const item = newNudgeManifest("code-135", "label-844");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
