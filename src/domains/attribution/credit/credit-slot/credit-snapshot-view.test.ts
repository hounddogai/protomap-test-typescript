import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditSnapshotView, toCreditSnapshotViews } from "./credit-snapshot-view.js";
import { newCreditSnapshot } from "./credit-snapshot.js";

test("CreditSnapshotView shows the status in capitals", () => {
  const item = newCreditSnapshot("code-744", "title-688");
  const view = toCreditSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditSnapshotViews([item, item]).length, 2, "views");
});
