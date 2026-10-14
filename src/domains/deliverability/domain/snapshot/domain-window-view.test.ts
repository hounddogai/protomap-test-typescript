import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainWindowView, toDomainWindowViews } from "./domain-window-view.js";
import { newDomainWindow } from "./domain-window.js";

test("DomainWindowView shows the status in capitals", () => {
  const item = newDomainWindow("code-563", "label-72");
  const view = toDomainWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainWindowViews([item, item]).length, 2, "views");
});
