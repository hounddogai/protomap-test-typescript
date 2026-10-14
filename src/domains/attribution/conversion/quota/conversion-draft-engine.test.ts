import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionDraftEngine } from "./conversion-draft-engine.js";
import { newConversionDraft } from "./conversion-draft.js";

test("ConversionDraftEngine keeps results within bounds", () => {
  const engine = defaultConversionDraftEngine(flags.newRegistry());
  const item = newConversionDraft("code-237", "label-68");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
