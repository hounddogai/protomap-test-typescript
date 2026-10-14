import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalManifestView, toApprovalManifestViews } from "./approval-manifest-view.js";
import { newApprovalManifest } from "./approval-manifest.js";

test("ApprovalManifestView shows the status in capitals", () => {
  const item = newApprovalManifest("code-40", "name-661");
  const view = toApprovalManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalManifestViews([item, item]).length, 2, "views");
});
