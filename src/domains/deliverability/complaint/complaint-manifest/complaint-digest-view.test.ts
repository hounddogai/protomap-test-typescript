import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintDigestView, toComplaintDigestViews } from "./complaint-digest-view.js";
import { newComplaintDigest } from "./complaint-digest.js";

test("ComplaintDigestView shows the status in capitals", () => {
  const item = newComplaintDigest("code-615", "title-101");
  const view = toComplaintDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintDigestViews([item, item]).length, 2, "views");
});
