import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationDraftEngine } from "./activation-draft-engine.js";
import { newActivationDraft } from "./activation-draft.js";

test("ActivationDraftEngine keeps results within bounds", () => {
  const engine = defaultActivationDraftEngine(flags.newRegistry());
  const item = newActivationDraft("code-430", "name-316");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
