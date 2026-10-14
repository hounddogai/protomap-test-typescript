import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightNoticeView, toFlightNoticeViews } from "./flight-notice-view.js";
import { newFlightNotice } from "./flight-notice.js";

test("FlightNoticeView shows the status in capitals", () => {
  const item = newFlightNotice("code-136", "name-897");
  const view = toFlightNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightNoticeViews([item, item]).length, 2, "views");
});
