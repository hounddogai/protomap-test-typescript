import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionRecordView, toDeflectionRecordViews } from "./deflection-record-view.js";
import { newDeflectionRecord } from "./deflection-record.js";

test("DeflectionRecordView shows the status in capitals", () => {
  const item = newDeflectionRecord("code-818", "name-198");
  const view = toDeflectionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionRecordViews([item, item]).length, 2, "views");
});
