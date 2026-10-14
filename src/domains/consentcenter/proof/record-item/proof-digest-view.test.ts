import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofDigestView, toProofDigestViews } from "./proof-digest-view.js";
import { newProofDigest } from "./proof-digest.js";

test("ProofDigestView shows the status in capitals", () => {
  const item = newProofDigest("code-357", "name-388");
  const view = toProofDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofDigestViews([item, item]).length, 2, "views");
});
