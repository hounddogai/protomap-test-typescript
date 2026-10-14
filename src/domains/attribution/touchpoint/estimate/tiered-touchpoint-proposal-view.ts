import * as text from "../../../../kit/text.js";
import { TieredTouchpointProposal } from "./tiered-touchpoint-proposal.js";

/** How screens and exports show a tiered touchpoint proposal. */
export class TieredTouchpointProposalView {
  code: string;
  nameText: string;
  archivedText: string;
  variantText: string;
  approved: string;
  segment: string;
  version: string;
  channel: string;
  checksum: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    archivedText: string,
    variantText: string,
    approved: string,
    segment: string,
    version: string,
    channel: string,
    checksum: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.archivedText = archivedText;
    this.variantText = variantText;
    this.approved = approved;
    this.segment = segment;
    this.version = version;
    this.channel = channel;
    this.checksum = checksum;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredTouchpointProposalView(item: TieredTouchpointProposal): TieredTouchpointProposalView {
  return new TieredTouchpointProposalView(
    item.code,
    item.name,
    `${item.archived}`,
    text.truncate(item.variant, 80),
    `${item.approved}`,
    item.segment,
    String(item.version),
    item.channel,
    item.checksum,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredTouchpointProposalViews(items: TieredTouchpointProposal[]): TieredTouchpointProposalView[] {
  const views: TieredTouchpointProposalView[] = [];
  for (const item of items) {
    views.push(toTieredTouchpointProposalView(item));
  }
  return views;
}

export function sumTieredTouchpointProposalView(view: TieredTouchpointProposalView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedVersion + parsedMinimum;
}
