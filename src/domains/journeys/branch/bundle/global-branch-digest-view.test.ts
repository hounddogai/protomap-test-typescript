import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBranchDigestView, toGlobalBranchDigestViews } from "./global-branch-digest-view.js";
import { newGlobalBranchDigest } from "./global-branch-digest.js";

test("GlobalBranchDigestView shows the status in capitals", () => {
  const item = newGlobalBranchDigest("code-949", "label-793");
  const view = toGlobalBranchDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBranchDigestViews([item, item]).length, 2, "views");
});
