import * as text from "../../../../kit/text.js";
import { PrimaryDeflectionBaseline } from "./primary-deflection-baseline.js";

/** How screens and exports show a primary deflection baseline. */
export class PrimaryDeflectionBaselineView {
  codeText: string;
  titleText: string;
  clicks: string;
  limit: string;
  checksumText: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    clicks: string,
    limit: string,
    checksumText: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.clicks = clicks;
    this.limit = limit;
    this.checksumText = checksumText;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryDeflectionBaselineView(item: PrimaryDeflectionBaseline): PrimaryDeflectionBaselineView {
  return new PrimaryDeflectionBaselineView(
    text.truncate(item.code, 120),
    item.title,
    String(item.clicks),
    String(item.limit),
    item.checksum,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryDeflectionBaselineViews(items: PrimaryDeflectionBaseline[]): PrimaryDeflectionBaselineView[] {
  const views: PrimaryDeflectionBaselineView[] = [];
  for (const item of items) {
    views.push(toPrimaryDeflectionBaselineView(item));
  }
  return views;
}

export function sumPrimaryDeflectionBaselineView(view: PrimaryDeflectionBaselineView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedClicks + parsedLimit + parsedCeiling;
}
