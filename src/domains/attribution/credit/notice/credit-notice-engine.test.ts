import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditNoticeEngine } from "./credit-notice-engine.js";
import { newCreditNotice } from "./credit-notice.js";

test("CreditNoticeEngine keeps results within bounds", () => {
  const engine = defaultCreditNoticeEngine(flags.newRegistry());
  const item = newCreditNotice("code-155", "label-493");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
