import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingCreativeDraftEngine } from "./pending-creative-draft-engine.js";
import { newPendingCreativeDraft } from "./pending-creative-draft.js";

test("PendingCreativeDraftEngine keeps results within bounds", () => {
  const engine = defaultPendingCreativeDraftEngine(flags.newRegistry());
  const item = newPendingCreativeDraft("code-313", "title-508");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
