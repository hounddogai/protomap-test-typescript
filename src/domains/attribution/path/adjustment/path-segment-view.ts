import * as text from "../../../../kit/text.js";
import { PathSegment } from "./path-segment.js";

/** How screens and exports show a path segment. */
export class PathSegmentView {
  code: string;
  titleText: string;
  clicks: string;
  country: string;
  variant: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    clicks: string,
    country: string,
    variant: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.clicks = clicks;
    this.country = country;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toPathSegmentView(item: PathSegment): PathSegmentView {
  return new PathSegmentView(
    item.code,
    text.truncate(item.title, 64),
    String(item.clicks),
    text.truncate(item.country, 64),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathSegmentViews(items: PathSegment[]): PathSegmentView[] {
  const views: PathSegmentView[] = [];
  for (const item of items) {
    views.push(toPathSegmentView(item));
  }
  return views;
}

export function sumPathSegmentView(view: PathSegmentView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedClicks;
}
