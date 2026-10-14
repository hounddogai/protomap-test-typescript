import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintRequestView, toComplaintRequestViews } from "./complaint-request-view.js";
import { newComplaintRequest } from "./complaint-request.js";

test("ComplaintRequestView shows the status in capitals", () => {
  const item = newComplaintRequest("code-562", "title-826");
  const view = toComplaintRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintRequestViews([item, item]).length, 2, "views");
});
