import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationSnapshotView, toEscalationSnapshotViews } from "./escalation-snapshot-view.js";
import { newEscalationSnapshot } from "./escalation-snapshot.js";

test("EscalationSnapshotView shows the status in capitals", () => {
  const item = newEscalationSnapshot("code-253", "title-272");
  const view = toEscalationSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationSnapshotViews([item, item]).length, 2, "views");
});
