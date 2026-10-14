import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientQueueDraftView, toLenientQueueDraftViews } from "./lenient-queue-draft-view.js";
import { newLenientQueueDraft } from "./lenient-queue-draft.js";

test("LenientQueueDraftView shows the status in capitals", () => {
  const item = newLenientQueueDraft("code-753", "label-72");
  const view = toLenientQueueDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientQueueDraftViews([item, item]).length, 2, "views");
});
