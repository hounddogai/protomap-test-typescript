import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryDeflectionBaselineView,
  toPrimaryDeflectionBaselineViews,
} from "./primary-deflection-baseline-view.js";
import { newPrimaryDeflectionBaseline } from "./primary-deflection-baseline.js";

test("PrimaryDeflectionBaselineView shows the status in capitals", () => {
  const item = newPrimaryDeflectionBaseline("code-683", "title-844");
  const view = toPrimaryDeflectionBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryDeflectionBaselineViews([item, item]).length, 2, "views");
});
