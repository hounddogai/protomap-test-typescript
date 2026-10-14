import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingMacroRecordView, toRollingMacroRecordViews } from "./rolling-macro-record-view.js";
import { newRollingMacroRecord } from "./rolling-macro-record.js";

test("RollingMacroRecordView shows the status in capitals", () => {
  const item = newRollingMacroRecord("code-86", "name-505");
  const view = toRollingMacroRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingMacroRecordViews([item, item]).length, 2, "views");
});
