import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplySnapshotView, toReplySnapshotViews } from "./reply-snapshot-view.js";
import { newReplySnapshot } from "./reply-snapshot.js";

test("ReplySnapshotView shows the status in capitals", () => {
  const item = newReplySnapshot("code-919", "title-188");
  const view = toReplySnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplySnapshotViews([item, item]).length, 2, "views");
});
