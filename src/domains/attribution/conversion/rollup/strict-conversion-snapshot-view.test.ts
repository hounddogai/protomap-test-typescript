import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictConversionSnapshotView,
  toStrictConversionSnapshotViews,
} from "./strict-conversion-snapshot-view.js";
import { newStrictConversionSnapshot } from "./strict-conversion-snapshot.js";

test("StrictConversionSnapshotView shows the status in capitals", () => {
  const item = newStrictConversionSnapshot("code-632", "label-189");
  const view = toStrictConversionSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictConversionSnapshotViews([item, item]).length, 2, "views");
});
