import * as text from "../../../../kit/text.js";
import { PathMapping } from "./path-mapping.js";

/** How screens and exports show a path mapping. */
export class PathMappingView {
  code: string;
  title: string;
  channel: string;
  contactEmail: string;
  openRate: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channel: string,
    contactEmail: string,
    openRate: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.openRate = openRate;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toPathMappingView(item: PathMapping): PathMappingView {
  return new PathMappingView(
    item.code,
    text.truncate(item.title, 64),
    item.channel,
    item.contactEmail,
    item.openRate.toFixed(2),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathMappingViews(items: PathMapping[]): PathMappingView[] {
  const views: PathMappingView[] = [];
  for (const item of items) {
    views.push(toPathMappingView(item));
  }
  return views;
}

export function sumPathMappingView(view: PathMappingView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedOpenRate;
}
