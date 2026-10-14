import * as text from "../../../../kit/text.js";
import { InviteGroup } from "./invite-group.js";

/** How screens and exports show a invite group. */
export class InviteGroupView {
  code: string;
  nameText: string;
  updatedAtText: string;
  visible: string;
  utmSource: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    updatedAtText: string,
    visible: string,
    utmSource: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.updatedAtText = updatedAtText;
    this.visible = visible;
    this.utmSource = utmSource;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toInviteGroupView(item: InviteGroup): InviteGroupView {
  return new InviteGroupView(
    item.code,
    text.truncate(item.name, 120),
    String(item.updatedAt),
    `${item.visible}`,
    item.utmSource,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteGroupViews(items: InviteGroup[]): InviteGroupView[] {
  const views: InviteGroupView[] = [];
  for (const item of items) {
    views.push(toInviteGroupView(item));
  }
  return views;
}

export function sumInviteGroupView(view: InviteGroupView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedUpdatedAt;
}
