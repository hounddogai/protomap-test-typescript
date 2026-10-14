import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainSnapshotView, toDomainSnapshotViews } from "./domain-snapshot-view.js";
import { newDomainSnapshot } from "./domain-snapshot.js";

test("DomainSnapshotView shows the status in capitals", () => {
  const item = newDomainSnapshot("code-862", "label-986");
  const view = toDomainSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainSnapshotViews([item, item]).length, 2, "views");
});
