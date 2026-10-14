import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroDraftEngine } from "./macro-draft-engine.js";
import { newMacroDraft } from "./macro-draft.js";

test("MacroDraftEngine keeps results within bounds", () => {
  const engine = defaultMacroDraftEngine(flags.newRegistry());
  const item = newMacroDraft("code-138", "title-108");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
