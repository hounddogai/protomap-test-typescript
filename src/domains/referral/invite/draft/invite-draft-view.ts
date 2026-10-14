import { InviteDraft } from "./invite-draft.js";

/** How screens and exports show a invite draft. */
export class InviteDraftView {
  code: string;
  nameText: string;
  title: string;
  impressionsText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    title: string,
    impressionsText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.title = title;
    this.impressionsText = impressionsText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toInviteDraftView(item: InviteDraft): InviteDraftView {
  return new InviteDraftView(
    item.code,
    item.name,
    item.title,
    String(item.impressions),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteDraftViews(items: InviteDraft[]): InviteDraftView[] {
  const views: InviteDraftView[] = [];
  for (const item of items) {
    views.push(toInviteDraftView(item));
  }
  return views;
}

export function sumInviteDraftView(view: InviteDraftView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedImpressions;
}
