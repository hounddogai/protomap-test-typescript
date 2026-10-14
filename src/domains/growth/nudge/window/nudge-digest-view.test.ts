import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeDigestView, toNudgeDigestViews } from "./nudge-digest-view.js";
import { newNudgeDigest } from "./nudge-digest.js";

test("NudgeDigestView shows the status in capitals", () => {
  const item = newNudgeDigest("code-921", "title-4");
  const view = toNudgeDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeDigestViews([item, item]).length, 2, "views");
});
