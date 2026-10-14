import * as text from "../../../../kit/text.js";
import { PathProposal } from "./path-proposal.js";

/** How screens and exports show a path proposal. */
export class PathProposalView {
  code: string;
  name: string;
  graceDays: string;
  archivedText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDays: string,
    archivedText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.archivedText = archivedText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toPathProposalView(item: PathProposal): PathProposalView {
  return new PathProposalView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 64),
    String(item.graceDays),
    `${item.archived}`,
    text.truncate(item.locale, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathProposalViews(items: PathProposal[]): PathProposalView[] {
  const views: PathProposalView[] = [];
  for (const item of items) {
    views.push(toPathProposalView(item));
  }
  return views;
}

export function sumPathProposalView(view: PathProposalView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedGraceDays;
}
