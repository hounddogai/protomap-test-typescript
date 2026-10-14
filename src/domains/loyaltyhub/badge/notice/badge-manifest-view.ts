import { BadgeManifest } from "./badge-manifest.js";

/** How screens and exports show a badge manifest. */
export class BadgeManifestView {
  code: string;
  name: string;
  channel: string;
  approvedText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channel: string,
    approvedText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.approvedText = approvedText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeManifestView(item: BadgeManifest): BadgeManifestView {
  return new BadgeManifestView(
    item.code,
    item.name,
    item.channel,
    `${item.approved}`,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeManifestViews(items: BadgeManifest[]): BadgeManifestView[] {
  const views: BadgeManifestView[] = [];
  for (const item of items) {
    views.push(toBadgeManifestView(item));
  }
  return views;
}

export function sumBadgeManifestView(view: BadgeManifestView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
