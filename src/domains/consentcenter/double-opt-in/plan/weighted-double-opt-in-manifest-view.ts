import { WeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

/** How screens and exports show a weighted double opt in manifest. */
export class WeightedDoubleOptInManifestView {
  code: string;
  label: string;
  channelText: string;
  phoneText: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channelText: string,
    phoneText: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channelText = channelText;
    this.phoneText = phoneText;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedDoubleOptInManifestView(item: WeightedDoubleOptInManifest): WeightedDoubleOptInManifestView {
  return new WeightedDoubleOptInManifestView(
    item.code,
    item.label,
    item.channel,
    item.phone,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedDoubleOptInManifestViews(items: WeightedDoubleOptInManifest[]): WeightedDoubleOptInManifestView[] {
  const views: WeightedDoubleOptInManifestView[] = [];
  for (const item of items) {
    views.push(toWeightedDoubleOptInManifestView(item));
  }
  return views;
}

export function sumWeightedDoubleOptInManifestView(view: WeightedDoubleOptInManifestView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
