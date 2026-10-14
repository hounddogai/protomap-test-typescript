import * as text from "../../../../kit/text.js";
import { InviteManifest } from "./invite-manifest.js";

/** How screens and exports show a invite manifest. */
export class InviteManifestView {
  codeText: string;
  name: string;
  ratio: string;
  title: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ratio: string,
    title: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ratio = ratio;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toInviteManifestView(item: InviteManifest): InviteManifestView {
  return new InviteManifestView(
    text.truncate(item.code, 80),
    item.name,
    item.ratio.toFixed(2),
    item.title,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteManifestViews(items: InviteManifest[]): InviteManifestView[] {
  const views: InviteManifestView[] = [];
  for (const item of items) {
    views.push(toInviteManifestView(item));
  }
  return views;
}

export function sumInviteManifestView(view: InviteManifestView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRatio + parsedFrequencyCap;
}
