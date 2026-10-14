import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalComplaintDraftEngine } from "./global-complaint-draft-engine.js";
import { newGlobalComplaintDraft } from "./global-complaint-draft.js";

test("GlobalComplaintDraftEngine keeps results within bounds", () => {
  const engine = defaultGlobalComplaintDraftEngine(flags.newRegistry());
  const item = newGlobalComplaintDraft("code-687", "name-768");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
