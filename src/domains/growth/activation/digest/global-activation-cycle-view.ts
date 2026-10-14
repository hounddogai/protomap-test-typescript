import * as text from "../../../../kit/text.js";
import { GlobalActivationCycle } from "./global-activation-cycle.js";

/** How screens and exports show a global activation cycle. */
export class GlobalActivationCycleView {
  codeText: string;
  title: string;
  sequence: string;
  endsAt: string;
  ownerIdText: string;
  startsAt: string;
  reviewer: string;
  journeyIdText: string;
  bidText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    sequence: string,
    endsAt: string,
    ownerIdText: string,
    startsAt: string,
    reviewer: string,
    journeyIdText: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.ownerIdText = ownerIdText;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.journeyIdText = journeyIdText;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalActivationCycleView(item: GlobalActivationCycle): GlobalActivationCycleView {
  return new GlobalActivationCycleView(
    text.truncate(item.code, 120),
    item.title,
    String(item.sequence),
    String(item.endsAt),
    item.ownerId,
    String(item.startsAt),
    text.truncate(item.reviewer, 40),
    item.journeyId,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalActivationCycleViews(items: GlobalActivationCycle[]): GlobalActivationCycleView[] {
  const views: GlobalActivationCycleView[] = [];
  for (const item of items) {
    views.push(toGlobalActivationCycleView(item));
  }
  return views;
}

export function sumGlobalActivationCycleView(view: GlobalActivationCycleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedSequence + parsedEndsAt + parsedStartsAt;
}
