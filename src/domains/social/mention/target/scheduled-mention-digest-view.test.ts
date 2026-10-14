import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledMentionDigestView, toScheduledMentionDigestViews } from "./scheduled-mention-digest-view.js";
import { newScheduledMentionDigest } from "./scheduled-mention-digest.js";

test("ScheduledMentionDigestView shows the status in capitals", () => {
  const item = newScheduledMentionDigest("code-280", "label-702");
  const view = toScheduledMentionDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledMentionDigestViews([item, item]).length, 2, "views");
});
