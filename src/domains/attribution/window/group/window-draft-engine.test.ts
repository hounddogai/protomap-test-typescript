import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowDraftEngine } from "./window-draft-engine.js";
import { newWindowDraft } from "./window-draft.js";

test("WindowDraftEngine keeps results within bounds", () => {
  const engine = defaultWindowDraftEngine(flags.newRegistry());
  const item = newWindowDraft("code-621", "title-757");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
