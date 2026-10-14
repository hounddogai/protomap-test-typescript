import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalPacingRequestView, toGlobalPacingRequestViews } from "./global-pacing-request-view.js";
import { newGlobalPacingRequest } from "./global-pacing-request.js";

test("GlobalPacingRequestView shows the status in capitals", () => {
  const item = newGlobalPacingRequest("code-546", "label-496");
  const view = toGlobalPacingRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalPacingRequestViews([item, item]).length, 2, "views");
});
