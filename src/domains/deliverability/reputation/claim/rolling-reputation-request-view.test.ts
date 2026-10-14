import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingReputationRequestView,
  toRollingReputationRequestViews,
} from "./rolling-reputation-request-view.js";
import { newRollingReputationRequest } from "./rolling-reputation-request.js";

test("RollingReputationRequestView shows the status in capitals", () => {
  const item = newRollingReputationRequest("code-2", "label-816");
  const view = toRollingReputationRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingReputationRequestViews([item, item]).length, 2, "views");
});
