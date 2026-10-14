import * as text from "../../../../kit/text.js";
import { SeasonalTicketViewAssignment } from "./seasonal-ticket-view-assignment.js";

/** How screens and exports show a seasonal ticket view assignment. */
export class SeasonalTicketViewAssignmentView {
  code: string;
  titleText: string;
  attemptsText: string;
  bidText: string;
  revisionText: string;
  minimum: string;
  locale: string;
  region: string;
  version: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    attemptsText: string,
    bidText: string,
    revisionText: string,
    minimum: string,
    locale: string,
    region: string,
    version: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.attemptsText = attemptsText;
    this.bidText = bidText;
    this.revisionText = revisionText;
    this.minimum = minimum;
    this.locale = locale;
    this.region = region;
    this.version = version;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalTicketViewAssignmentView(item: SeasonalTicketViewAssignment): SeasonalTicketViewAssignmentView {
  return new SeasonalTicketViewAssignmentView(
    item.code,
    item.title,
    String(item.attempts),
    item.bid.toFixed(2),
    String(item.revision),
    item.minimum.toFixed(2),
    text.truncate(item.locale, 120),
    text.truncate(item.region, 80),
    String(item.version),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalTicketViewAssignmentViews(items: SeasonalTicketViewAssignment[]): SeasonalTicketViewAssignmentView[] {
  const views: SeasonalTicketViewAssignmentView[] = [];
  for (const item of items) {
    views.push(toSeasonalTicketViewAssignmentView(item));
  }
  return views;
}

export function sumSeasonalTicketViewAssignmentView(view: SeasonalTicketViewAssignmentView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedAttempts + parsedBid + parsedRevision;
}
