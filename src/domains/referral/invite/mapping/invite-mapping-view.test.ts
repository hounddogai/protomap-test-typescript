import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteMappingView, toInviteMappingViews } from "./invite-mapping-view.js";
import { newInviteMapping } from "./invite-mapping.js";

test("InviteMappingView shows the status in capitals", () => {
  const item = newInviteMapping("code-585", "name-855");
  const view = toInviteMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteMappingViews([item, item]).length, 2, "views");
});
