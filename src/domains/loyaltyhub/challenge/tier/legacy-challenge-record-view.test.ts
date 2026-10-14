import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyChallengeRecordView, toLegacyChallengeRecordViews } from "./legacy-challenge-record-view.js";
import { newLegacyChallengeRecord } from "./legacy-challenge-record.js";

test("LegacyChallengeRecordView shows the status in capitals", () => {
  const item = newLegacyChallengeRecord("code-465", "name-880");
  const view = toLegacyChallengeRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyChallengeRecordViews([item, item]).length, 2, "views");
});
