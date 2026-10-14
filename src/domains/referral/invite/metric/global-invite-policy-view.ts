import * as text from "../../../../kit/text.js";
import { GlobalInvitePolicy } from "./global-invite-policy.js";

/** How screens and exports show a global invite policy. */
export class GlobalInvitePolicyView {
  code: string;
  titleText: string;
  audienceId: string;
  campaignRef: string;
  createdAtText: string;
  capacityText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    audienceId: string,
    campaignRef: string,
    createdAtText: string,
    capacityText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.audienceId = audienceId;
    this.campaignRef = campaignRef;
    this.createdAtText = createdAtText;
    this.capacityText = capacityText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalInvitePolicyView(item: GlobalInvitePolicy): GlobalInvitePolicyView {
  return new GlobalInvitePolicyView(
    item.code,
    item.title,
    text.truncate(item.audienceId, 64),
    item.campaignRef,
    String(item.createdAt),
    String(item.capacity),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalInvitePolicyViews(items: GlobalInvitePolicy[]): GlobalInvitePolicyView[] {
  const views: GlobalInvitePolicyView[] = [];
  for (const item of items) {
    views.push(toGlobalInvitePolicyView(item));
  }
  return views;
}

export function sumGlobalInvitePolicyView(view: GlobalInvitePolicyView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedCreatedAt + parsedCapacity;
}
