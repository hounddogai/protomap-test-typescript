import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultConversionSnapshotView,
  toDefaultConversionSnapshotViews,
} from "./default-conversion-snapshot-view.js";
import { newDefaultConversionSnapshot } from "./default-conversion-snapshot.js";

test("DefaultConversionSnapshotView shows the status in capitals", () => {
  const item = newDefaultConversionSnapshot("code-144", "name-363");
  const view = toDefaultConversionSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultConversionSnapshotViews([item, item]).length, 2, "views");
});
