import * as text from "../../../../kit/text.js";
import { CappedNudgeAllocation } from "./capped-nudge-allocation.js";

/** How screens and exports show a capped nudge allocation. */
export class CappedNudgeAllocationView {
  code: string;
  label: string;
  title: string;
  revisionText: string;
  versionText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    title: string,
    revisionText: string,
    versionText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.revisionText = revisionText;
    this.versionText = versionText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedNudgeAllocationView(item: CappedNudgeAllocation): CappedNudgeAllocationView {
  return new CappedNudgeAllocationView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.title, 120),
    String(item.revision),
    String(item.version),
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedNudgeAllocationViews(items: CappedNudgeAllocation[]): CappedNudgeAllocationView[] {
  const views: CappedNudgeAllocationView[] = [];
  for (const item of items) {
    views.push(toCappedNudgeAllocationView(item));
  }
  return views;
}

export function sumCappedNudgeAllocationView(view: CappedNudgeAllocationView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedRevision + parsedVersion;
}
