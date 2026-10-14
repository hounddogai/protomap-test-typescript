import { LenientBranchCycle } from "./lenient-branch-cycle.js";

/** How screens and exports show a lenient branch cycle. */
export class LenientBranchCycleView {
  code: string;
  name: string;
  sequence: string;
  startsAt: string;
  clicksText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sequence: string,
    startsAt: string,
    clicksText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.clicksText = clicksText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toLenientBranchCycleView(item: LenientBranchCycle): LenientBranchCycleView {
  return new LenientBranchCycleView(
    item.code,
    item.name,
    String(item.sequence),
    String(item.startsAt),
    String(item.clicks),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientBranchCycleViews(items: LenientBranchCycle[]): LenientBranchCycleView[] {
  const views: LenientBranchCycleView[] = [];
  for (const item of items) {
    views.push(toLenientBranchCycleView(item));
  }
  return views;
}

export function sumLenientBranchCycleView(view: LenientBranchCycleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedSequence + parsedStartsAt + parsedClicks;
}
