import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeRecordView, toChallengeRecordViews } from "./challenge-record-view.js";
import { newChallengeRecord } from "./challenge-record.js";

test("ChallengeRecordView shows the status in capitals", () => {
  const item = newChallengeRecord("code-27", "label-47");
  const view = toChallengeRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeRecordViews([item, item]).length, 2, "views");
});
