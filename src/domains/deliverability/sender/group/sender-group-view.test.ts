import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderGroupView, toSenderGroupViews } from "./sender-group-view.js";
import { newSenderGroup } from "./sender-group.js";

test("SenderGroupView shows the status in capitals", () => {
  const item = newSenderGroup("code-879", "name-671");
  const view = toSenderGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderGroupViews([item, item]).length, 2, "views");
});
