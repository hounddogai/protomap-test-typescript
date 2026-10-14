import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintExceptionView, toComplaintExceptionViews } from "./complaint-exception-view.js";
import { newComplaintException } from "./complaint-exception.js";

test("ComplaintExceptionView shows the status in capitals", () => {
  const item = newComplaintException("code-899", "name-823");
  const view = toComplaintExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintExceptionViews([item, item]).length, 2, "views");
});
