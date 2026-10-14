import * as text from "../../../../kit/text.js";
import { DomainBundle } from "./domain-bundle.js";

/** How screens and exports show a domain bundle. */
export class DomainBundleView {
  codeText: string;
  titleText: string;
  nameText: string;
  utmSource: string;
  description: string;
  frequencyCap: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    nameText: string,
    utmSource: string,
    description: string,
    frequencyCap: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.nameText = nameText;
    this.utmSource = utmSource;
    this.description = description;
    this.frequencyCap = frequencyCap;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toDomainBundleView(item: DomainBundle): DomainBundleView {
  return new DomainBundleView(
    item.code,
    text.truncate(item.title, 40),
    text.truncate(item.name, 80),
    text.truncate(item.utmSource, 80),
    item.description,
    String(item.frequencyCap),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainBundleViews(items: DomainBundle[]): DomainBundleView[] {
  const views: DomainBundleView[] = [];
  for (const item of items) {
    views.push(toDomainBundleView(item));
  }
  return views;
}

export function sumDomainBundleView(view: DomainBundleView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedFrequencyCap + parsedVersion;
}
