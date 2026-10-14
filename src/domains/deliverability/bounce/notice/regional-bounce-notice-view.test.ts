import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalBounceNoticeView, toRegionalBounceNoticeViews } from "./regional-bounce-notice-view.js";
import { newRegionalBounceNotice } from "./regional-bounce-notice.js";

test("RegionalBounceNoticeView shows the status in capitals", () => {
  const item = newRegionalBounceNotice("code-360", "name-135");
  const view = toRegionalBounceNoticeView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalBounceNoticeViews([item, item]).length, 2, "views");
});
