import * as text from "../../../../kit/text.js";
import { DeflectionProposal } from "./deflection-proposal.js";

/** How screens and exports show a deflection proposal. */
export class DeflectionProposalView {
  codeText: string;
  name: string;
  pinned: string;
  versionText: string;
  ownerId: string;
  score: string;
  sendAtText: string;
  country: string;
  startsAt: string;
  unitText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    pinned: string,
    versionText: string,
    ownerId: string,
    score: string,
    sendAtText: string,
    country: string,
    startsAt: string,
    unitText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.pinned = pinned;
    this.versionText = versionText;
    this.ownerId = ownerId;
    this.score = score;
    this.sendAtText = sendAtText;
    this.country = country;
    this.startsAt = startsAt;
    this.unitText = unitText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionProposalView(item: DeflectionProposal): DeflectionProposalView {
  return new DeflectionProposalView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    `${item.pinned}`,
    String(item.version),
    text.truncate(item.ownerId, 120),
    item.score.toFixed(2),
    String(item.sendAt),
    item.country,
    String(item.startsAt),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionProposalViews(items: DeflectionProposal[]): DeflectionProposalView[] {
  const views: DeflectionProposalView[] = [];
  for (const item of items) {
    views.push(toDeflectionProposalView(item));
  }
  return views;
}

export function sumDeflectionProposalView(view: DeflectionProposalView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedVersion + parsedScore + parsedSendAt;
}
