import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeManifestView, toChallengeManifestViews } from "./challenge-manifest-view.js";
import { newChallengeManifest } from "./challenge-manifest.js";

test("ChallengeManifestView shows the status in capitals", () => {
  const item = newChallengeManifest("code-426", "title-345");
  const view = toChallengeManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeManifestViews([item, item]).length, 2, "views");
});
