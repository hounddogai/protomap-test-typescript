import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintProfileEngine } from "./complaint-profile-engine.js";
import { newComplaintProfile } from "./complaint-profile.js";

test("ComplaintProfileEngine keeps results within bounds", () => {
  const engine = defaultComplaintProfileEngine(flags.newRegistry());
  const item = newComplaintProfile("code-438", "title-507");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
