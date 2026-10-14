import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueueDraftEngine } from "./queue-draft-engine.js";
import { newQueueDraft } from "./queue-draft.js";

test("QueueDraftEngine keeps results within bounds", () => {
  const engine = defaultQueueDraftEngine(flags.newRegistry());
  const item = newQueueDraft("code-763", "title-474");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
