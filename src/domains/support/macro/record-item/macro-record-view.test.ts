import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroRecordView, toMacroRecordViews } from "./macro-record-view.js";
import { newMacroRecord } from "./macro-record.js";

test("MacroRecordView shows the status in capitals", () => {
  const item = newMacroRecord("code-446", "label-82");
  const view = toMacroRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroRecordViews([item, item]).length, 2, "views");
});
