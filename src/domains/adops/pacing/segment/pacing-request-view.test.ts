import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingRequestView, toPacingRequestViews } from "./pacing-request-view.js";
import { newPacingRequest } from "./pacing-request.js";

test("PacingRequestView shows the status in capitals", () => {
  const item = newPacingRequest("code-803", "label-446");
  const view = toPacingRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingRequestViews([item, item]).length, 2, "views");
});
