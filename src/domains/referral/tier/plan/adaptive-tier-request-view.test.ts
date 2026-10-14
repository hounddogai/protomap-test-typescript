import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveTierRequestView, toAdaptiveTierRequestViews } from "./adaptive-tier-request-view.js";
import { newAdaptiveTierRequest } from "./adaptive-tier-request.js";

test("AdaptiveTierRequestView shows the status in capitals", () => {
  const item = newAdaptiveTierRequest("code-172", "title-822");
  const view = toAdaptiveTierRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveTierRequestViews([item, item]).length, 2, "views");
});
