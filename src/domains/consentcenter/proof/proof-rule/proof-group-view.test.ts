import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofGroupView, toProofGroupViews } from "./proof-group-view.js";
import { newProofGroup } from "./proof-group.js";

test("ProofGroupView shows the status in capitals", () => {
  const item = newProofGroup("code-932", "title-572");
  const view = toProofGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofGroupViews([item, item]).length, 2, "views");
});
