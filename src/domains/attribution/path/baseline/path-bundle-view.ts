import * as text from "../../../../kit/text.js";
import { PathBundle } from "./path-bundle.js";

/** How screens and exports show a path bundle. */
export class PathBundleView {
  codeText: string;
  title: string;
  retries: string;
  startsAt: string;
  contactEmail: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    retries: string,
    startsAt: string,
    contactEmail: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.retries = retries;
    this.startsAt = startsAt;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPathBundleView(item: PathBundle): PathBundleView {
  return new PathBundleView(
    item.code,
    item.title,
    String(item.retries),
    String(item.startsAt),
    text.truncate(item.contactEmail, 120),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathBundleViews(items: PathBundle[]): PathBundleView[] {
  const views: PathBundleView[] = [];
  for (const item of items) {
    views.push(toPathBundleView(item));
  }
  return views;
}

export function sumPathBundleView(view: PathBundleView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedRetries + parsedStartsAt;
}
